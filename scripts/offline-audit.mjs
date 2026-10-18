#!/usr/bin/env node
// Browser audit of every simulation module against a running Algo-Sim server.
//
//   node scripts/offline-audit.mjs [baseUrl] [outDir]      (default http://127.0.0.1:3000, ./audit-out)
//
// For each module, in a fresh browser context (cold cache) it opens the category page, selects the module,
// starts the animation and steps through a few frames, then records:
//   - every network request, flagging any that leave the server's host (should be none: offline operation);
//   - uncaught page errors and console errors;
//   - navigation timing (TTFB, DOMContentLoaded, load) and bytes transferred;
//   - a screenshot.
// Results go to <outDir>/audit.json and <outDir>/screens/*.png. Uses an installed Edge or Chrome
// (playwright-core does not download browsers): set BROWSER_CHANNEL=chrome to use Chrome.
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"

const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "")
const outDir = process.argv[3] ?? "audit-out"
const channel = process.env.BROWSER_CHANNEL ?? "msedge"
const serverHost = new URL(base).host

const AOA = {
  sorting: ["Insertion Sort", "Selection Sort"],
  divide: ["Minimum and Maximum", "Merge Sort", "Quick Sort", "Heap Sort", "Strassen's Matrix Multiplication"],
  greedy: ["Knapsack Problem", "Job Scheduling with Deadlines", "Minimum Spanning Trees", "Single Source Shortest Path"],
  dp: ["Multistage Graphs", "0/1 Knapsack", "Travelling Salesman Problem", "Single Source Shortest Path", "All Pairs Shortest Path", "Matrix Chain Multiplication"],
  backtracking: ["Sum of Subsets", "8-Queens Problem", "Graph Coloring"],
  branch: ["0/1 Knapsack", "15 Puzzle Problem"],
}
const DS = {
  stack: ["Stack Operations"],
  queue: ["Linear Queue", "Circular Queue", "Double-ended Queue", "Priority Queue"],
  linkedlist: ["Singly Linked List", "Doubly Linked List", "Circular Linked List", "Circular Doubly Linked List"],
}
const modules = [
  ...Object.entries(AOA).flatMap(([cat, names]) => names.map((name) => ({ url: `/simulate/${cat}`, cat, name }))),
  ...Object.entries(DS).flatMap(([cat, names]) => names.map((name) => ({ url: `/simulate/ds/${cat}`, cat, name }))),
]

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

// click the first visible, enabled button whose text matches
async function clickButton(page, pattern) {
  const buttons = page.getByRole("button", { name: pattern })
  const n = await buttons.count()
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(i)
    if ((await b.isVisible()) && (await b.isEnabled())) {
      await b.click()
      return true
    }
  }
  return false
}

async function exercise(page, isDS) {
  if (isDS) {
    // one data-structure operation with a value, then a second one, so the display has to update
    for (const v of ["42", "17"]) {
      const input = page.locator("input:visible").first()
      if (await input.count()) await input.fill(v)
      await clickButton(page, /^(push|enqueue|insert at (beginning|head)|insert at end|add rear|add front|insert)/i)
      await page.waitForTimeout(400)
    }
    return
  }
  await clickButton(page, /^(start|play|solve|run|visualize|find|begin)/i)
  await page.waitForTimeout(1200)
  for (let k = 0; k < 4; k++) {
    if (!(await clickButton(page, /^(step|next)/i))) break
    await page.waitForTimeout(250)
  }
  await clickButton(page, /^pause$/i)
}

mkdirSync(path.join(outDir, "screens"), { recursive: true })
const browser = await chromium.launch({ channel, headless: true })
const results = []
for (const m of modules) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 })
  const page = await context.newPage()
  const requests = []
  const pageErrors = []
  const consoleErrors = []
  page.on("request", (r) => requests.push(r.url()))
  page.on("pageerror", (e) => pageErrors.push(String(e.message ?? e)))
  page.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()))

  await page.goto(base + m.url, { waitUntil: "load" })
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0]
    const res = performance.getEntriesByType("resource")
    return {
      ttfbMs: +(nav.responseStart - nav.requestStart).toFixed(1),
      domContentLoadedMs: +nav.domContentLoadedEventEnd.toFixed(1),
      loadMs: +nav.loadEventEnd.toFixed(1),
      transferKB: +((nav.transferSize + res.reduce((t, r) => t + (r.transferSize || 0), 0)) / 1024).toFixed(1),
      resources: res.length + 1,
    }
  })
  await clickButton(page, new RegExp("^" + m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  await page.waitForTimeout(800)
  const comingSoon = await page.getByText("Coming Soon").isVisible().catch(() => false)
  await exercise(page, m.url.includes("/ds/"))
  // buttons a screen reader would announce without a name (no text, aria-label, title or <label>)
  const unnamedButtons = await page.evaluate(() =>
    [...document.querySelectorAll("button")].filter(
      (b) => b.offsetParent && !(b.getAttribute("aria-label") || b.getAttribute("title") || b.textContent.trim() || b.labels?.length),
    ).length,
  )
  const file = `${m.url.includes("/ds/") ? "ds" : "aoa"}-${m.cat}-${slug(m.name)}.png`
  await page.screenshot({ path: path.join(outDir, "screens", file), fullPage: false })

  const external = [...new Set(requests.filter((u) => !u.startsWith("data:") && !u.startsWith("blob:") && new URL(u).host !== serverHost))]
  results.push({ module: m.name, page: m.url, comingSoon, requests: requests.length, external, pageErrors, consoleErrors, unnamedButtons, ...timing, screenshot: file })
  console.log(`${external.length ? "EXT" : "ok "} ${pageErrors.length ? "ERR" : "   "} ${m.url} :: ${m.name}  ttfb ${timing.ttfbMs} ms, load ${timing.loadMs} ms, ${timing.transferKB} KB`)
  await context.close()
}
await browser.close()

const summary = {
  base,
  browser: channel,
  date: new Date().toISOString(),
  modules: results.length,
  modulesWithExternalRequests: results.filter((r) => r.external.length).length,
  modulesWithPageErrors: results.filter((r) => r.pageErrors.length).length,
  modulesShowingComingSoon: results.filter((r) => r.comingSoon).length,
  modulesWithConsoleErrors: results.filter((r) => r.consoleErrors.length).length,
  unnamedButtons: results.reduce((t, r) => t + r.unnamedButtons, 0),
}
writeFileSync(path.join(outDir, "audit.json"), JSON.stringify({ summary, results }, null, 2) + "\n")
console.log(JSON.stringify(summary, null, 2))

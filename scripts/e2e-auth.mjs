#!/usr/bin/env node
// End-to-end check of local sign-in, feedback and the admin view against a running server.
//
//   node scripts/create-users.mjs users.csv creds.csv      (users.csv: student01 and instructor; the
//                                                           instructor's e-mail must be in ADMIN_EMAILS)
//   node scripts/e2e-auth.mjs http://127.0.0.1:3000 creds.csv
//
// Prints a JSON summary; every check should be true, 401 for the student, 200 for the instructor and 400 for
// the malformed submission. Use a test database: the script submits a feedback record.
import { chromium } from "playwright-core"
import { readFileSync } from "node:fs"
const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "")
const creds = Object.fromEntries(readFileSync(process.argv[3] ?? "credentials-out.csv", "utf8").trim().split(/\r?\n/).slice(1).map((l) => { const [u, , p] = l.split(","); return [u, p] }))
const result = {}
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true })
async function signIn(ctx, user) {
  const page = await ctx.newPage()
  await page.goto(base + "/auth/signin")
  await page.getByLabel("Username or e-mail").fill(user)
  await page.getByLabel("Password").fill(creds[user])
  await page.getByRole("button", { name: /institution account/i }).click()
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {})
  return page
}
// wrong password is rejected
{ const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(base + "/auth/signin")
  await page.getByLabel("Username or e-mail").fill("student01"); await page.getByLabel("Password").fill("not-the-password")
  await page.getByRole("button", { name: /institution account/i }).click(); await page.waitForTimeout(1500)
  result.wrongPasswordRejected = (await page.getByText("Incorrect username or password").isVisible()) && !page.url().includes("/dashboard"); await ctx.close() }
// student signs in, submits feedback, cannot read all feedback
{ const ctx = await browser.newContext(); const page = await signIn(ctx, "student01")
  result.studentSignedIn = page.url().endsWith("/dashboard")
  await page.goto(base + "/feedback"); await page.waitForTimeout(800)
  await page.getByLabel("Institute Name *").fill("Offline test institute")
  const pick = async (i, option) => { await page.getByRole("combobox").nth(i).click(); await page.getByRole("option", { name: option, exact: true }).click(); await page.waitForTimeout(150) }
  await pick(0, "Computer Science and Engineering"); await pick(1, "Algorithms"); await pick(2, "Divide and Conquer"); await pick(3, "Merge Sort")
  for (const id of ["sim-Excellent", "man-Very Good", "int-Good", "exp-Excellent", "inn-Yes", "manual-No"]) await page.locator(`[id="${id}"]`).click()
  await page.getByRole("button", { name: /submit/i }).click(); await page.waitForTimeout(2000)
  result.feedbackSubmittedText = (await page.locator("body").innerText()).match(/thank you|success|submitted/i)?.[0] ?? null
  result.studentAdminApiStatus = (await page.request.get(base + "/api/feedback")).status()
  await ctx.close() }
// instructor (listed in ADMIN_EMAILS) sees the submission
{ const ctx = await browser.newContext(); const page = await signIn(ctx, "instructor")
  result.instructorSignedIn = page.url().endsWith("/dashboard")
  const api = await page.request.get(base + "/api/feedback"); result.instructorAdminApiStatus = api.status()
  const body = await api.json(); result.feedbackRecords = body.feedbacks?.length ?? 0; result.recordInstitute = body.feedbacks?.[0]?.instituteName
  await page.goto(base + "/admin"); await page.waitForTimeout(2500)
    await ctx.close() }
// malformed submission is rejected by validation
{ const ctx = await browser.newContext(); const page = await signIn(ctx, "student01")
  const r = await page.request.post(base + "/api/feedback", { data: { instituteName: "", experiments: [], ratings: { simulation: "10/10" } } })
  result.malformedFeedbackStatus = r.status(); await ctx.close() }
await browser.close()
console.log(JSON.stringify(result, null, 2))

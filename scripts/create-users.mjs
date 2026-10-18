#!/usr/bin/env node
// Create or update institution-issued local accounts from a CSV file, for air-gapped deployments.
//
//   node scripts/create-users.mjs students.csv [credentials-out.csv]
//
// Input columns (header row required): username,name[,email][,password]
// Rows without a password get a generated one. The output CSV lists username,name,password for
// every account whose password was set, so the instructor can hand them out; keep it private.
// Requires MONGODB_URI in the environment.
import { readFileSync, writeFileSync } from "node:fs"
import { MongoClient } from "mongodb"
import { generatePassword, hashPassword } from "../lib/password.mjs"

const [, , input, output = "credentials-out.csv"] = process.argv
if (!input || !process.env.MONGODB_URI) {
  console.error("usage: MONGODB_URI=... node scripts/create-users.mjs users.csv [credentials-out.csv]")
  process.exit(1)
}

const parseLine = (line) => line.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"))
const [header, ...rows] = readFileSync(input, "utf8").split(/\r?\n/).filter((l) => l.trim())
const cols = parseLine(header).map((h) => h.toLowerCase())
if (!cols.includes("username")) {
  console.error("the CSV header must contain a 'username' column")
  process.exit(1)
}

const client = await new MongoClient(process.env.MONGODB_URI).connect()
const users = client.db().collection("users")
await users.createIndex({ username: 1 }, { unique: true, sparse: true })

const issued = []
for (const line of rows) {
  const cells = parseLine(line)
  const rec = Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]))
  const username = rec.username.toLowerCase()
  if (!username) continue
  const password = rec.password || generatePassword()
  await users.updateOne(
    { username },
    {
      $set: { username, name: rec.name || username, email: rec.email ? rec.email.toLowerCase() : null, passwordHash: hashPassword(password) },
      $setOnInsert: { emailVerified: null, createdAt: new Date() },
    },
    { upsert: true },
  )
  issued.push([username, rec.name || username, password])
}
await client.close()

writeFileSync(output, ["username,name,password", ...issued.map((r) => r.join(","))].join("\n") + "\n", { mode: 0o600 })
console.log(`${issued.length} account(s) created or updated; credentials written to ${output}`)

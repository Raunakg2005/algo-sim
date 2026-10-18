import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generatePassword, hashPassword, verifyPassword } from "@/lib/password.mjs"

describe("local account passwords", () => {
  it("verifies the right password and rejects any other", () => {
    fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 40 }), fc.string({ minLength: 1, maxLength: 40 }), (pw, other) => {
      const stored = hashPassword(pw)
      expect(verifyPassword(pw, stored)).toBe(true)
      if (other.normalize("NFKC") !== pw.normalize("NFKC")) expect(verifyPassword(other, stored)).toBe(false)
    }), { numRuns: 20 })
  }, 60_000)

  it("salts every hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"))
  })

  it("rejects malformed stored values", () => {
    for (const bad of [undefined, null, "", "plain", "md5$x$y", 42]) expect(verifyPassword("x", bad)).toBe(false)
  })

  it("generates readable passwords of the requested length", () => {
    const pw = generatePassword(12)
    expect(pw).toHaveLength(12)
    expect(pw).not.toMatch(/[0O1lI]/)
  })
})

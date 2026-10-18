// Password hashing for institution-issued local accounts (no external identity provider).
// scrypt from Node's standard library; stored as "scrypt$N$r$p$salt$hash" (base64).
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const N = 16384, R = 8, P = 1, KEYLEN = 32

export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P })
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$")
}

export function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false
  const [scheme, n, r, p, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "base64")
  const actual = scryptSync(password.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, {
    N: Number(n), r: Number(r), p: Number(p),
  })
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// readable one-time passwords for distribution to a class (no 0/O/1/l/I)
export function generatePassword(length = 10) {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(length)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

import type { NextAuthOptions } from "next-auth"
import type { Provider } from "next-auth/providers/index"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { getMongoClient } from "./mongodb"
import { verifyPassword } from "./password.mjs"

// Sign-in methods are enabled by configuration:
//  - local accounts (username + password issued by the institution) work on an air-gapped LAN and
//    are on unless LOCAL_AUTH=false; create them with `node scripts/create-users.mjs`;
//  - Google OAuth when GOOGLE_CLIENT_ID/SECRET are set (needs internet);
//  - e-mailed magic sign-in links when EMAIL_SERVER_HOST is set (needs an SMTP relay).
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const emailEnabled = Boolean(process.env.EMAIL_SERVER_HOST)
const localEnabled = process.env.LOCAL_AUTH !== "false" || (!googleEnabled && !emailEnabled)

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

const providers: Provider[] = []
if (localEnabled) {
  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "Institution account",
      credentials: {
        username: { label: "Username or e-mail", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim().toLowerCase()
        const password = credentials?.password ?? ""
        if (!username || !password) return null
        const db = (await getMongoClient()).db()
        const user = await db.collection("users").findOne({ $or: [{ username }, { email: username }] })
        if (!user || !verifyPassword(password, user.passwordHash)) return null
        return { id: user._id.toString(), name: user.name ?? username, email: user.email ?? null }
      },
    }),
  )
}
if (googleEnabled) {
  providers.push(
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  )
}
if (emailEnabled) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 15 * 60, // sign-in links expire after 15 minutes
    }),
  )
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(getMongoClient) as NextAuthOptions["adapter"],
  providers,
  pages: { signIn: "/auth/signin" },
  // JWT sessions are required by the credentials provider and avoid a database read per request
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string | undefined) ?? token.sub ?? ""
        session.user.isAdmin = isAdminEmail(session.user.email)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return baseUrl + url
      if (url.startsWith(baseUrl)) return url
      return baseUrl + "/dashboard"
    },
  },
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin?: boolean
    }
  }
}

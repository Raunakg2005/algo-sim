import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "./mongodb"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id
        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
        session.user.isAdmin = adminEmails.includes(user.email || '')
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Check if user is admin and redirect to admin panel
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
      
      // If callback URL is set and contains dashboard, check if user is admin
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to dashboard
      return baseUrl + '/dashboard'
    },
  },
  session: {
    strategy: "database",
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

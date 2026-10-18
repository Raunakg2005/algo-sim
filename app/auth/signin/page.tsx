"use client"

import { getProviders, signIn, type ClientSafeProvider } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Chrome, KeyRound, Mail } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleLocalSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const res = await signIn("credentials", { username, password, redirect: false })
    setIsLoading(false)
    if (res?.ok) router.push("/dashboard")
    else setError("Incorrect username or password")
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await signIn("email", { email, callbackUrl: "/dashboard", redirect: false })
    setEmailSent(true)
    setIsLoading(false)
  }

  const has = (id: string) => Boolean(providers?.[id])
  const divider = (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-gray-500">Or</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Algo-Sim</h1>
          <p className="text-gray-600">Sign in to submit feedback. Simulations need no account.</p>
        </div>

        {emailSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Mail className="w-12 h-12 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-green-800 mb-1">Check your email</h3>
            <p className="text-sm text-green-700">
              We have sent you a sign-in link. It is valid for 15 minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers === null && <p className="text-center text-sm text-gray-500">Loading sign-in options...</p>}

            {has("credentials") && (
              <form onSubmit={handleLocalSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username or e-mail</Label>
                  <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                  <KeyRound className="w-5 h-5 mr-2" />
                  Sign in with institution account
                </Button>
              </form>
            )}

            {has("credentials") && (has("google") || has("email")) && divider}

            {has("google") && (
              <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full" size="lg" variant="outline">
                <Chrome className="w-5 h-5 mr-2" />
                Sign in with Google
              </Button>
            )}

            {has("google") && has("email") && divider}

            {has("email") && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full" size="lg" variant="outline">
                  <Mail className="w-5 h-5 mr-2" />
                  Email me a sign-in link
                </Button>
              </form>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

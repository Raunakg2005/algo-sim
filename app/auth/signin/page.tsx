"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Chrome, Mail } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await signIn("email", { email, callbackUrl: "/dashboard" })
    setEmailSent(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Algo-Sim</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        {emailSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Mail className="w-12 h-12 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-green-800 mb-1">Check your email</h3>
            <p className="text-sm text-green-700">
              We've sent you a magic link to sign in. Click the link in the email to continue.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Chrome className="w-5 h-5 mr-2" />
                Sign in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                  <Mail className="w-5 h-5 mr-2" />
                  Sign in with Email (OTP)
                </Button>
              </form>
            </div>

            <p className="text-xs text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </>
        )}
      </Card>
    </div>
  )
}

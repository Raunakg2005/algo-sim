import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'Algo-Sim',
  description: 'Created by RKG',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { ClientProviders } from '@/components/providers/ClientProviders'
import './globals.css'

export const metadata: Metadata = {
  title: 'Feedify — Microlearning Feed',
  description: 'Transform long-form content into a bite-sized learning feed powered by local AI',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0514',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}

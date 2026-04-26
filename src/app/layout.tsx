import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Manrope } from 'next/font/google'
import TopNavBar from '@/components/TopNavBar'
import NavigationProgressWrapper from '@/components/NavigationProgressWrapper'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: { default: 'CINEMA', template: '%s | CINEMA' },
  description: 'Stream premium content. Anytime.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#0e0e0e',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-cinema-bg text-white font-sans antialiased min-h-screen">
        <NavigationProgressWrapper />
        <TopNavBar />
        {children}
      </body>
    </html>
  )
}

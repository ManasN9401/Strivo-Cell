import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets:  ['latin'],
  variable: '--font-manrope',
  display:  'swap',
  weight:   ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title:       { default: 'CINEMA', template: '%s | CINEMA' },
  description: 'Stream premium content. Anytime.',
  icons:       { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#0e0e0e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-cinema-bg text-white font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TownHelp',
  description: 'Neighborhood services, simplified.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}>
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <main className="flex-1 pb-24">{children}</main>
        {user && <BottomNav />}
      </body>
    </html>
  )
}

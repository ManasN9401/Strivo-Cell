import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Footer from '@/components/Footer'
import { updateEmail, updatePassword, updateProfile } from '@/lib/actions/settings'
import { signOut } from '@/lib/actions/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import SettingsTabs from '@/components/settings/SettingsTabs'

export const metadata = { title: 'Settings' }

interface Props {
  searchParams: Promise<{
    error?: string
    success?: string
    tab?: string
  }>
}

const MESSAGES: Record<string, string> = {
  'email-updated': 'Email updated — check your inbox to confirm the change.',
  'password-updated': 'Password updated successfully.',
  'profile-updated': 'Public profile updated successfully.',
}

async function SettingsContent() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email ?? ''
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsTabs email={email} profile={profile} userId={user.id} />
  )
}

export default async function SettingsPage({ searchParams }: Props) {
  const { error, success } = await searchParams
  const successMsg = success ? MESSAGES[success] : null

  return (
    <>
      <main className="bg-strivo-bg min-h-screen pt-20">
        <div className="max-w-content mx-auto px-8 py-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">Settings</h1>
          <p className="text-white/40 text-sm mb-10">Manage your account</p>

          {error && (
            <div
              role="alert"
              className="mb-8 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20
                         text-red-400 text-sm max-w-2xl"
            >
              {decodeURIComponent(error)}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-8 px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20
                         text-green-400 text-sm max-w-2xl"
            >
              {successMsg}
            </div>
          )}

          <Suspense
            fallback={
              <div className="max-w-2xl space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 bg-strivo-surface rounded-2xl animate-pulse" />
                ))}
              </div>
            }
          >
            <SettingsContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}

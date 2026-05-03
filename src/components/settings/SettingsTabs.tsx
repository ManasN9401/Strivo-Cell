'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { updateEmail, updatePassword, updateProfile } from '@/lib/actions/settings'
import { signOut } from '@/lib/actions/auth'

interface Profile {
  username?: string | null
  bio?: string | null
  avatar_url?: string | null
  social_twitter?: string | null
  social_youtube?: string | null
  social_instagram?: string | null
}

interface Props {
  email: string
  profile: Profile | null
  userId: string
}

export default function SettingsTabs({ email, profile, userId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(currentTab)

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createSupabaseBrowserClient()

  const tabs = [
    { id: 'profile', label: 'Public Profile' },
    { id: 'account', label: 'Account' },
    { id: 'security', label: 'Security' },
    { id: 'danger', label: 'Danger Zone' },
  ]

  function handleTabChange(id: string) {
    setActiveTab(id)
    router.replace(`/settings?tab=${id}`, { scroll: false })
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      // Upsert profile with new avatar URL
      const { error: updateError } = await supabase.from('profiles').upsert({
        id: userId,
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString()
      })

      if (updateError) throw updateError
      
      router.refresh()
    } catch (error) {
      alert('Error uploading avatar!')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Vertical Nav Bar */}
      <nav className="md:w-64 shrink-0 flex flex-col gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                       text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent
              ${activeTab === tab.id 
                ? 'bg-strivo-accent text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 max-w-2xl">
        {activeTab === 'profile' && (
          <section className="bg-strivo-surface rounded-2xl p-8 border border-white/[0.06] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold mb-1">Public Profile</h2>
            <p className="text-white/40 text-sm mb-6">Manage how you appear to others on Strivo</p>

            <form action={updateProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/40 text-2xl font-bold">{email[0]?.toUpperCase() ?? 'U'}</span>
                  )}
                  
                  {/* Upload Overlay */}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:opacity-100"
                  >
                    <span className="text-white text-xs font-semibold">
                      {uploading ? 'Uploading...' : 'Change'}
                    </span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>
                
                <div className="flex-1">
                  <label htmlFor="avatar_url" className="block text-sm text-white/60 mb-1.5">Avatar URL (or click avatar to upload)</label>
                  <input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    defaultValue={profile?.avatar_url ?? ''}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-strivo-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm text-white/60 mb-1.5">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={profile?.username ?? ''}
                  placeholder="e.g. strivofan123"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-strivo-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm text-white/60 mb-1.5">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  defaultValue={profile?.bio ?? ''}
                  placeholder="Tell us a little bit about yourself"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-strivo-accent transition-colors resize-none"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/80 border-b border-white/10 pb-2">Social Links</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="social_twitter" className="block text-xs text-white/50 mb-1">X / Twitter</label>
                    <input
                      id="social_twitter"
                      name="social_twitter"
                      type="text"
                      defaultValue={profile?.social_twitter ?? ''}
                      placeholder="@username"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-strivo-accent transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="social_youtube" className="block text-xs text-white/50 mb-1">YouTube</label>
                    <input
                      id="social_youtube"
                      name="social_youtube"
                      type="text"
                      defaultValue={profile?.social_youtube ?? ''}
                      placeholder="@channel"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-strivo-accent transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="social_instagram" className="block text-xs text-white/50 mb-1">Instagram</label>
                  <input
                    id="social_instagram"
                    name="social_instagram"
                    type="text"
                    defaultValue={profile?.social_instagram ?? ''}
                    placeholder="@username"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-strivo-accent transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-strivo-accent hover:bg-strivo-accent-hover text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
              >
                Save Profile
              </button>
            </form>
          </section>
        )}

        {activeTab === 'account' && (
          <section className="bg-strivo-surface rounded-2xl p-8 border border-white/[0.06] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold mb-1">Account Email</h2>
            <p className="text-white/40 text-sm mb-6">Manage your account email address</p>

            <form action={updateEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={email}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                             text-white text-sm outline-none
                             focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20
                             transition-colors duration-200"
                />
              </div>
              <button
                type="submit"
                className="bg-strivo-accent hover:bg-strivo-accent-hover text-white
                           font-semibold px-6 py-2.5 rounded-lg text-sm
                           transition-colors cursor-pointer
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-strivo-accent"
              >
                Update email
              </button>
            </form>
            
            <div className="mt-10 pt-8 border-t border-white/10">
              <h2 className="text-lg font-semibold mb-1">Session Management</h2>
              <p className="text-white/40 text-sm mb-6">Sign out of your active session</p>

              <form action={signOut}>
                <button
                  type="submit"
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold
                             px-6 py-2.5 rounded-lg text-sm border border-white/10
                             transition-colors cursor-pointer
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-strivo-accent"
                >
                  Sign out of all devices
                </button>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'security' && (
          <section className="bg-strivo-surface rounded-2xl p-8 border border-white/[0.06] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold mb-1">Password</h2>
            <p className="text-white/40 text-sm mb-6">Choose a strong password of at least 8 characters</p>

            <form action={updatePassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                             text-white placeholder:text-white/20 text-sm outline-none
                             focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20
                             transition-colors duration-200"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm text-white/60 mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Repeat new password"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                             text-white placeholder:text-white/20 text-sm outline-none
                             focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20
                             transition-colors duration-200"
                />
              </div>
              <button
                type="submit"
                className="bg-strivo-accent hover:bg-strivo-accent-hover text-white
                           font-semibold px-6 py-2.5 rounded-lg text-sm
                           transition-colors cursor-pointer
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-strivo-accent"
              >
                Update password
              </button>
            </form>
          </section>
        )}

        {activeTab === 'danger' && (
          <section className="bg-red-500/5 rounded-2xl p-8 border border-red-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold text-red-400 mb-1">Danger zone</h2>
            <p className="text-white/40 text-sm mb-6">
              Deleting your account is permanent and cannot be undone.
            </p>
            <a
              href="mailto:support@strivo.example.com?subject=Account+deletion+request"
              className="inline-block bg-red-500/10 hover:bg-red-500/20 text-red-400
                         font-semibold px-6 py-2.5 rounded-lg text-sm border border-red-500/20
                         transition-colors focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-red-400"
            >
              Request account deletion
            </a>
          </section>
        )}
      </div>
    </div>
  )
}

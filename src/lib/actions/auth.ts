'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/signup?success=check-email')
}

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const next = (formData.get('next') as string) || '/'

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    )
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
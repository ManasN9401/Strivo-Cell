'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function updateEmail(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.updateUser({ email })

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/settings')
  redirect('/settings?success=email-updated')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) {
    redirect('/settings?error=Passwords+do+not+match')
  }

  if (password.length < 8) {
    redirect('/settings?error=Password+must+be+at+least+8+characters')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/settings')
  redirect('/settings?success=password-updated')
}

export async function deleteAccount() {
  redirect('/settings?error=Account+deletion+must+be+done+via+support')
}
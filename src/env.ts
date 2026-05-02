import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:             z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL:                 z.string().url().optional(),
})

function validateEnv() {
  const result = schema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL:             process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL:                 process.env.NEXT_PUBLIC_SITE_URL,
  })

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    result.error.issues.forEach(i => {
      console.error(`  ${i.path.join('.')}: ${i.message}`)
    })
    throw new Error('Missing or invalid environment variables. Check your .env.local file.')
  }

  return result.data
}

export const env = validateEnv()

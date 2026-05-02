import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const testPath = `videos/${user.id}/test-${Date.now()}.mp4`
  
  // Try creating a signed upload URL
  const { data, error } = await supabase.storage
    .from('creator-uploads')
    .createSignedUploadUrl(testPath)

  if (error) {
    return NextResponse.json({ 
      step: 'createSignedUploadUrl',
      error: error.message,
      details: error 
    })
  }

  // Now try a tiny test upload directly from the server
  const testContent = new Uint8Array([0, 1, 2, 3])
  const putRes = await fetch(data.signedUrl, {
    method: 'PUT',
    body: testContent,
  })

  const putText = await putRes.text()

  return NextResponse.json({
    signedUrl: data.signedUrl,
    putStatus: putRes.status,
    putResponse: putText,
    userId: user.id,
    testPath,
  })
}
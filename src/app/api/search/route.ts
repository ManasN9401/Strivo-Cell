import { NextRequest, NextResponse } from 'next/server'
import { searchTitles }              from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.trim().length < 2) return NextResponse.json({ titles: [] })

  const titles = await searchTitles(q.trim())
  return NextResponse.json({ titles })
}

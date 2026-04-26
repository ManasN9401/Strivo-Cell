import { getFeaturedTitles } from '@/lib/supabase/queries'
import HeroBannerClient      from './HeroBannerClient'

export default async function HeroBanner() {
  const titles = await getFeaturedTitles()
  return <HeroBannerClient titles={titles} />
}

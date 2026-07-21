import { KitDetailPageClient } from './KitDetailPageClient'
import { loadKitStaticParams } from '../../../../lib/kit-static-params'

export async function generateStaticParams() {
  return loadKitStaticParams()
}

export default function KitDetailPage() {
  return <KitDetailPageClient />
}

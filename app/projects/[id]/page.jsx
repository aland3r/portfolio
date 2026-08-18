import { fetchProjects } from '../../../lib/gestalt-auth/projects.js'
import PublicationDetail from '../../components/PublicationDetail'

export async function generateStaticParams() {
  try {
    const rows = await fetchProjects()
    if (rows?.length) {
      return rows.map((entry) => ({ id: entry.code }))
    }
  } catch {
    // Supabase may be unavailable at build time — fall back to known codes.
  }

  return [{ id: 'deviante' }, { id: 'milebrick' }, { id: 'asteroids' }]
}

export default function ProjectDetailPage() {
  return <PublicationDetail />
}

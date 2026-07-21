import publications from '../../../content/projects.json'
import PublicationDetail from '../../components/PublicationDetail'

export function generateStaticParams() {
  return publications.map((entry) => ({ id: entry.id }))
}

export default function PublicationDetailPage() {
  return <PublicationDetail />
}

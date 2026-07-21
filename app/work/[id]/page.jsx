import experienceCatalog from '../../../content/experience.json'
import ExperienceDetail from '../../components/ExperienceDetail'

export function generateStaticParams() {
  return experienceCatalog.map((entry) => ({ id: entry.id }))
}

export default function ExperienceDetailPage() {
  return <ExperienceDetail />
}

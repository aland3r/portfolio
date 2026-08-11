import { STATIC_EXPERIENCES } from '../../../lib/experience.js'
import ExperienceDetail from '../../components/ExperienceDetail'

export function generateStaticParams() {
  return STATIC_EXPERIENCES.filter((entry) => entry.featured).map((entry) => ({ id: entry.id }))
}

export default function ExperienceDetailPage() {
  return <ExperienceDetail />
}

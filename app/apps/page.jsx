'use client'

import AppHub from '../components/AppHub'
import HeroFlowField from '../components/HeroFlowField'

export default function AppsPage() {
  return (
    <section className="panel panel--apps">
      <HeroFlowField variant="aguaVivaZoom" spacer={false} />
      <AppHub />
    </section>
  )
}

'use client'

import GamifierHud from './GamifierHud'
import { useRoadmap } from './RoadmapProvider'

function withProgress(product) {
  const quests = product.phases.flatMap((phase) => phase.quests)
  const done = quests.filter((quest) => quest.status === 'done').length
  const total = quests.length
  return {
    ...product,
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

export default function FloatingGamifierHud() {
  const { roadmap, gestaltVersion } = useRoadmap()
  const products = roadmap.products.map(withProgress)

  return <GamifierHud products={products} gestaltVersion={gestaltVersion} />
}

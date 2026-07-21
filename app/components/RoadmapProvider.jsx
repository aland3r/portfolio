'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchAllQuests, fetchGestaltVersion, fetchProductsMeta } from '../../lib/gestalt-auth/quests.js'
import { buildRoadmapFromRows, GESTALT_ROADMAP } from '../../lib/roadmap'

const RoadmapContext = createContext(null)

export function RoadmapProvider({ children }) {
  const [roadmap, setRoadmap] = useState(GESTALT_ROADMAP)
  const [source, setSource] = useState('json')
  const [loading, setLoading] = useState(true)
  const [gestaltVersion, setGestaltVersion] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [questRows, productRows, versionRow] = await Promise.all([
          fetchAllQuests(),
          fetchProductsMeta(),
          fetchGestaltVersion(),
        ])
        if (cancelled) return

        if (questRows && questRows.length > 0) {
          setRoadmap(buildRoadmapFromRows(questRows, productRows ?? []))
          setSource('db')
        }
        // else: keep the static JSON already in state — table exists but is
        // empty, or Supabase isn't configured (isSupabaseConfigured() → null).
        if (versionRow) setGestaltVersion(versionRow)
      } catch {
        // keep the static JSON fallback already in state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <RoadmapContext.Provider
      value={{ roadmap, roadmapLoading: loading, roadmapSource: source, gestaltVersion }}
    >
      {children}
    </RoadmapContext.Provider>
  )
}

export function useRoadmap() {
  const context = useContext(RoadmapContext)
  if (!context) {
    throw new Error('useRoadmap must be used within RoadmapProvider')
  }
  return context
}

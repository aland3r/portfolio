'use client'

import { AuthProvider } from './AuthProvider'
import { LocaleProvider } from './LocaleProvider'
import SiteShell from './shell/SiteShell'
import { RoadmapProvider } from './RoadmapProvider'
import '../globals.css'
import '../gamifier.css'

export default function ClientRoot({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <RoadmapProvider>
          <SiteShell>{children}</SiteShell>
        </RoadmapProvider>
      </AuthProvider>
    </LocaleProvider>
  )
}

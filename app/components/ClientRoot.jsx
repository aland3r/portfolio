'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from './AuthProvider'
import { LocaleProvider } from './LocaleProvider'
import FloatingCvDownload from './FloatingCvDownload'
import FloatingGamifierHud from './FloatingGamifierHud'
import SiteShell from './shell/SiteShell'
import { RoadmapProvider } from './RoadmapProvider'
import '../globals.css'
import '../gamifier.css'

function FloatingDock() {
  const pathname = usePathname()
  const hide = pathname === '/login' || pathname === '/auth/callback'
  if (hide) return null

  return (
    <>
      {/* Quest log is outside the dock: .floating-dock uses transform, which
          traps position:fixed and pinned the HUD to the content column. */}
      <FloatingGamifierHud />
      <div className="floating-dock">
        <FloatingCvDownload />
      </div>
    </>
  )
}

export default function ClientRoot({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <RoadmapProvider>
          <SiteShell>{children}</SiteShell>
          <FloatingDock />
        </RoadmapProvider>
      </AuthProvider>
    </LocaleProvider>
  )
}

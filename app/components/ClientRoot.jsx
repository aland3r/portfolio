'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from './AuthProvider'
import { LocaleProvider } from './LocaleProvider'
import FloatingSoundCloudPlayer from './FloatingSoundCloudPlayer'
import FloatingCvDownload from './FloatingCvDownload'
import FloatingGamifierHud from './FloatingGamifierHud'
import GestaltShell from './GestaltShell'
import { RoadmapProvider } from './RoadmapProvider'
import { SoundCloudPlayerProvider } from './SoundCloudPlayerProvider'
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
        <FloatingSoundCloudPlayer />
      </div>
    </>
  )
}

export default function ClientRoot({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <RoadmapProvider>
          <SoundCloudPlayerProvider>
            <GestaltShell>{children}</GestaltShell>
            <FloatingDock />
          </SoundCloudPlayerProvider>
        </RoadmapProvider>
      </AuthProvider>
    </LocaleProvider>
  )
}

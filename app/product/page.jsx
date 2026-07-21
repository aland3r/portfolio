'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LegacyProductRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/apps')
  }, [router])
  return (
    <section className="panel">
      <p className="muted">Redirecting…</p>
    </section>
  )
}

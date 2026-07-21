'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** @deprecated UC3 deferred — redirect to contact. */
export default function RequestAccessRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/contact')
  }, [router])

  return (
    <section className="panel">
      <p className="muted">…</p>
    </section>
  )
}

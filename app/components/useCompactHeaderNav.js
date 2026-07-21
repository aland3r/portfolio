'use client'

import { useLayoutEffect, useState } from 'react'

const MOBILE_MAX_WIDTH = 767
const NAV_UTIL_GAP = 12

function headerNeedsCompactNav(header) {
  if (!header || typeof window === 'undefined') return false
  if (window.innerWidth <= MOBILE_MAX_WIDTH) return true

  const nav = header.querySelector('.gestalt-nav--desktop')
  const utilities = header.querySelector('.gestalt-header__utilities--desktop')
  if (!nav || !utilities) return false

  if (nav.scrollWidth > nav.clientWidth + 2) return true

  const navRect = nav.getBoundingClientRect()
  const utilRect = utilities.getBoundingClientRect()
  if (navRect.right > utilRect.left - NAV_UTIL_GAP) return true

  return header.scrollWidth > header.clientWidth + 2
}

function measureCompactNav(header) {
  if (!header) return false

  const wasCompact = header.classList.contains('gestalt-header--compact')
  if (wasCompact) {
    header.classList.remove('gestalt-header--compact')
  }

  const needsCompact = headerNeedsCompactNav(header)

  if (needsCompact) {
    header.classList.add('gestalt-header--compact')
  } else {
    header.classList.remove('gestalt-header--compact')
  }

  return needsCompact
}

export function useCompactHeaderNav(headerRef, enabled = true, remeasureKey = '') {
  const [compact, setCompact] = useState(false)

  useLayoutEffect(() => {
    if (!enabled) {
      setCompact(false)
      return undefined
    }

    const header = headerRef.current
    if (!header) return undefined

    function syncCompact() {
      if (window.innerWidth <= MOBILE_MAX_WIDTH) {
        setCompact((prev) => (prev ? prev : true))
        return
      }

      const node = headerRef.current
      if (!node) return

      const needsCompact = measureCompactNav(node)
      setCompact((prev) => (prev === needsCompact ? prev : needsCompact))
    }

    syncCompact()

    const observer = new ResizeObserver(syncCompact)
    observer.observe(header)
    window.addEventListener('resize', syncCompact, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncCompact)
    }
  }, [enabled, headerRef, remeasureKey])

  return compact
}

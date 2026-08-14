'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavLocaleSwitcher } from '../NavResumeMenu'

export default function MobileNavMenu({
  navLinks,
  isNavActive,
  isAuthenticated,
  loading,
  loginHref,
  onLogout,
  t,
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const overlay = open && mounted ? (
    <>
      <button
        type="button"
        className="gestalt-mobile-nav__backdrop"
        aria-label={t('nav.closeMenu')}
        onClick={() => setOpen(false)}
      />
      <div
        id="gestalt-mobile-nav-panel"
        className="gestalt-mobile-nav__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menuLabel')}
      >
        <nav className="gestalt-mobile-nav__links" aria-label={t('nav.menuLabel')}>
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isNavActive(item.href)
                  ? 'gestalt-mobile-nav__link gestalt-nav__link gestalt-nav__link--active'
                  : 'gestalt-mobile-nav__link gestalt-nav__link'
              }
              aria-current={isNavActive(item.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="gestalt-mobile-nav__utilities">
          {!loading && isAuthenticated ? (
            <button
              type="button"
              className="gestalt-util__button"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
            >
              {t('nav.out')}
            </button>
          ) : !loading ? (
            <Link href={loginHref} className="gestalt-util__link" onClick={() => setOpen(false)}>
              {t('nav.in')}
            </Link>
          ) : null}

          <NavLocaleSwitcher />
        </div>
      </div>
    </>
  ) : null

  return (
    <div className="gestalt-mobile-nav">
      <button
        type="button"
        className="gestalt-mobile-nav__toggle"
        aria-expanded={open}
        aria-controls="gestalt-mobile-nav-panel"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
      >
        <span className="gestalt-mobile-nav__bars" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      {overlay ? createPortal(overlay, document.body) : null}
    </div>
  )
}

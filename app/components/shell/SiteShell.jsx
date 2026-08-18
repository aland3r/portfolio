'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '../AuthProvider'
import { useLocale } from '../LocaleProvider'
import AccessRequestsNotice from '../AccessRequestsNotice'
import AdminGovernanceAvatar from '../AdminGovernanceAvatar'
import { useCompactHeaderNav } from '../useCompactHeaderNav'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

export default function SiteShell({ children }) {
  const pathname = usePathname()

  const headerRef = useRef(null)
  const shellRef = useRef(null)
  const topChromeRef = useRef(null)
  const brandMarkRef = useRef(null)
  const avatarFloatRef = useRef(null)

  const {
    authUser,
    isAuthenticated,
    isOwner,
    logout,
    loading,
  } = useAuth()

  const { t } = useLocale()

  const hideNav =
    pathname === '/login' ||
    pathname === '/auth/callback'

  const showOwnerAvatar = isOwner && !hideNav

  const isNavActive = (href) =>
    pathname === href ||
    (href !== '/' && pathname.startsWith(`${href}/`))

  const ownerDisplayName =
    authUser?.user_metadata?.full_name
    ?? authUser?.user_metadata?.name
    ?? authUser?.email
    ?? ''

  const ownerInitials =
    ownerDisplayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'A'

  const navLinks = [
    { href: '/work', label: t('nav.work') },
    { href: '/apps', label: t('nav.products') },
    { href: '/projects', label: t('nav.projects') },
    ...(isOwner
      ? [
          { href: '/cases', label: t('nav.useCases') },
          { href: '/kit', label: t('nav.kit') },
        ]
      : []),
  ]

  const compactNav = useCompactHeaderNav(
    headerRef,
    !hideNav,
    `${navLinks.length}:${loading}:${isOwner}:${isAuthenticated}`,
  )

  useLayoutEffect(() => {
    const brandMark = brandMarkRef.current
    const avatarFloat = avatarFloatRef.current
    const shell = shellRef.current
    const header = headerRef.current

    if (
      !brandMark ||
      !avatarFloat ||
      !shell ||
      !header ||
      !showOwnerAvatar
    ) {
      avatarFloat?.style.removeProperty('--gestalt-admin-avatar-x')
      avatarFloat?.style.removeProperty('--gestalt-admin-avatar-y')
      avatarFloat?.removeAttribute('data-owner-anchor-ready')
      shell?.style.removeProperty('--gestalt-owner-avatar-clearance')

      return undefined
    }

    function syncFloatingAvatar() {
      const mark = brandMarkRef.current
      const float = avatarFloatRef.current
      const shellNode = shellRef.current
      const headerNode = headerRef.current

      if (!mark || !float || !shellNode || !headerNode) return

      const markRect = mark.getBoundingClientRect()
      const shellRect = shellNode.getBoundingClientRect()
      const headerRect = headerNode.getBoundingClientRect()

      const styles = getComputedStyle(document.documentElement)

      const edgeGap =
        parseFloat(
          styles.getPropertyValue('--nav-chrome-edge-gap'),
        ) || 8

      const breath =
        parseFloat(
          styles.getPropertyValue('--gestalt-owner-avatar-breath'),
        ) || edgeGap

      const avatarSize =
        float.getBoundingClientRect().height
        || parseFloat(
          styles.getPropertyValue('--nav-admin-avatar-size'),
        )
        || 40

      const isFineMobile =
        window.matchMedia('(max-width: 767px)').matches

      const verticalInset =
        isFineMobile
          ? avatarSize * 0.42
          : avatarSize / 2

      const centerX =
        markRect.left +
        markRect.width / 2 -
        shellRect.left

      const centerY =
        headerRect.bottom +
        edgeGap +
        verticalInset -
        shellRect.top

      float.style.setProperty(
        '--gestalt-admin-avatar-x',
        `${centerX}px`,
      )

      float.style.setProperty(
        '--gestalt-admin-avatar-y',
        `${centerY}px`,
      )

      float.dataset.ownerAnchorReady = 'true'

      const mainEl =
        shellNode.querySelector('.gestalt-main')

      if (mainEl && isFineMobile) {
        const mainRect = mainEl.getBoundingClientRect()
        const floatRect = float.getBoundingClientRect()

        const clearance = Math.max(
          0,
          Math.ceil(
            floatRect.bottom -
            mainRect.top +
            breath,
          ),
        )

        shellNode.style.setProperty(
          '--gestalt-owner-avatar-clearance',
          `${clearance}px`,
        )
      } else {
        shellNode.style.removeProperty(
          '--gestalt-owner-avatar-clearance',
        )
      }
    }

    syncFloatingAvatar()

    const observer =
      new ResizeObserver(syncFloatingAvatar)

    observer.observe(brandMark)
    observer.observe(header)
    observer.observe(shell)

    const mainEl =
      shell.querySelector('.gestalt-main')

    if (mainEl) observer.observe(mainEl)
    observer.observe(avatarFloat)

    window.addEventListener(
      'resize',
      syncFloatingAvatar,
      { passive: true },
    )

    return () => {
      observer.disconnect()

      window.removeEventListener(
        'resize',
        syncFloatingAvatar,
      )

      avatarFloat.style.removeProperty(
        '--gestalt-admin-avatar-x',
      )

      avatarFloat.style.removeProperty(
        '--gestalt-admin-avatar-y',
      )

      avatarFloat.removeAttribute(
        'data-owner-anchor-ready',
      )

      shell.style.removeProperty(
        '--gestalt-owner-avatar-clearance',
      )
    }
  }, [showOwnerAvatar, compactNav, loading])

  useLayoutEffect(() => {
    const chrome = topChromeRef.current

    if (!chrome || hideNav) {
      document.documentElement.style.removeProperty(
        '--gestalt-chrome-height',
      )

      return undefined
    }

    function syncChromeHeight() {
      const node = topChromeRef.current
      if (!node) return

      document.documentElement.style.setProperty(
        '--gestalt-chrome-height',
        `${node.getBoundingClientRect().height}px`,
      )
    }

    syncChromeHeight()

    const observer =
      new ResizeObserver(syncChromeHeight)

    observer.observe(chrome)

    window.addEventListener(
      'resize',
      syncChromeHeight,
      { passive: true },
    )

    return () => {
      observer.disconnect()

      window.removeEventListener(
        'resize',
        syncChromeHeight,
      )

      document.documentElement.style.removeProperty(
        '--gestalt-chrome-height',
      )
    }
  }, [hideNav, compactNav, loading])

  const ownerAvatar = (
    <AdminGovernanceAvatar
      href="/admin"
      active={isNavActive('/admin')}
      avatarUrl={
        authUser?.user_metadata?.avatar_url
        ?? authUser?.user_metadata?.picture
        ?? null
      }
      label={t('nav.adminGovernance')}
      initials={ownerInitials}
    />
  )

  return (
    <div ref={shellRef} className="gestalt-shell">
      {!hideNav ? (
        <div
          ref={topChromeRef}
          className="gestalt-top-chrome"
        >
          <SiteHeader
            headerRef={headerRef}
            brandMarkRef={brandMarkRef}
            compactNav={compactNav}
            navLinks={navLinks}
            isNavActive={isNavActive}
            isAuthenticated={isAuthenticated}
            loading={loading}
            logout={logout}
            t={t}
          />
        </div>
      ) : null}

      {showOwnerAvatar ? (
        <div
          ref={avatarFloatRef}
          className="gestalt-admin-avatar-float"
        >
          {ownerAvatar}
        </div>
      ) : null}

      <div id="root">
        <main
          className={
            hideNav
              ? 'gestalt-main gestalt-main--auth'
              : 'gestalt-main'
          }
        >
          {!hideNav ? <AccessRequestsNotice /> : null}
          {children}
        </main>
      </div>

      {!hideNav ? <SiteFooter /> : null}
    </div>
  )
}
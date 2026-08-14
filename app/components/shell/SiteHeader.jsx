'use client'

import Link from 'next/link'
import { NavLocaleSwitcher } from '../NavResumeMenu'
import MobileNavMenu from './MobileNavMenu'
import { loginHref } from '../../../lib/auth-intent'
import { SITE_NAME, SITE_NAME_SHORT } from '../../../lib/site'

export default function SiteHeader({
  headerRef,
  brandMarkRef,
  compactNav,
  navLinks,
  isNavActive,
  isAuthenticated,
  loading,
  logout,
  t,
}) {
  return (
    <header
      ref={headerRef}
      className={
        compactNav
          ? 'gestalt-header gestalt-header--compact'
          : 'gestalt-header'
      }
    >
      <div className="gestalt-header__primary">
        <span
          ref={brandMarkRef}
          className="gestalt-brand-mark"
        >
          <Link
            href="/"
            className="gestalt-brand"
            aria-label={SITE_NAME}
          >
            {SITE_NAME_SHORT}
          </Link>
        </span>

        <nav
          className="gestalt-nav gestalt-nav--desktop"
          aria-label="Primary"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isNavActive(item.href)
                  ? 'gestalt-nav__link gestalt-nav__link--active'
                  : 'gestalt-nav__link'
              }
              aria-current={
                isNavActive(item.href)
                  ? 'page'
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        className="gestalt-header__utilities gestalt-header__utilities--desktop"
        aria-label="Site utilities"
      >
        <span className="gestalt-util__auth-slot">
          {loading ? (
            <span
              className="gestalt-util__auth-placeholder"
              aria-hidden="true"
            >
              —
            </span>
          ) : isAuthenticated ? (
            <button
              type="button"
              className="gestalt-util__button"
              onClick={() => logout()}
            >
              {t('nav.out')}
            </button>
          ) : (
            <Link
              href={loginHref()}
              className="gestalt-util__link"
            >
              {t('nav.in')}
            </Link>
          )}
        </span>

        <NavLocaleSwitcher />
      </div>

      <MobileNavMenu
        navLinks={navLinks}
        isNavActive={isNavActive}
        isAuthenticated={isAuthenticated}
        loading={loading}
        loginHref={loginHref()}
        onLogout={logout}
        t={t}
      />
    </header>
  )
}
'use client'

import { usePathname } from 'next/navigation'
import NavSocialLinks from '../NavSocialLinks'

export default function SiteFooter() {
  const pathname = usePathname()
  // O crédito da arte só aparece na home (onde a animação vive).
  const showCredit = pathname === '/'

  return (
    <footer className="gestalt-footer">
      <NavSocialLinks />
      {showCredit && (
        <p className="gestalt-footer__credit">
          visual art by{' '}
          <a
            className="gestalt-footer__credit-link"
            href="https://x.com/yuruyurau"
            target="_blank"
            rel="noopener noreferrer"
          >
            ア
          </a>
        </p>
      )}
    </footer>
  )
}

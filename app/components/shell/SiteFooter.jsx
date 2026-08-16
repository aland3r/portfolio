'use client'

import NavSocialLinks from '../NavSocialLinks'

export default function SiteFooter() {
  return (
    <footer className="gestalt-footer">
      <NavSocialLinks />
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
    </footer>
  )
}

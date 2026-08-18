'use client'

import { getSocialLinks } from '../../lib/social'
import { useLocale } from './LocaleProvider'

const SOCIAL_LABEL_KEYS = {
  github: 'nav.github',
  linkedin: 'nav.linkedin',
  x: 'nav.x',
  email: 'nav.email',
}

function GitHubIcon() {
  return (
    <svg className="nav-social__icon" aria-hidden="true" viewBox="0 0 19 19" width="22" height="22">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="nav-social__icon" aria-hidden="true" viewBox="0 0 19 19" width="22" height="22">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1.893 1.98c.052.072 1.245 1.769 2.653 3.77l2.892 4.114c.183.261.333.48.333.486s-.068.089-.152.183l-.522.593-.765.867-3.597 4.087c-.375.426-.734.834-.798.905a1 1 0 0 0-.118.148c0 .01.236.017.664.017h.663l.729-.83c.4-.457.796-.906.879-.999a692 692 0 0 0 1.794-2.038c.034-.037.301-.34.594-.675l.551-.624.345-.392a7 7 0 0 1 .34-.374c.006 0 .93 1.306 2.052 2.903l2.084 2.965.045.063h2.275c1.87 0 2.273-.003 2.266-.021-.008-.02-1.098-1.572-3.894-5.547-2.013-2.862-2.28-3.246-2.273-3.266.008-.019.282-.332 2.085-2.38l2-2.274 1.567-1.782c.022-.028-.016-.03-.65-.03h-.674l-.3.342a871 871 0 0 1-1.782 2.025c-.067.075-.405.458-.75.852a100 100 0 0 1-.803.91c-.148.172-.299.344-.99 1.127-.304.343-.32.358-.345.327-.015-.019-.904-1.282-1.976-2.808L6.365 1.85H1.8zm1.782.91 8.078 11.294c.772 1.08 1.413 1.973 1.425 1.984.016.017.241.02 1.05.017l1.03-.004-2.694-3.766L7.796 5.75 5.722 2.852l-1.039-.004-1.039-.004z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      className="nav-social__icon nav-social__icon--linkedin"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
    >
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg className="nav-social__icon" aria-hidden="true" viewBox="0 0 19 19" width="22" height="22">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2.5 4.35h14a.85.85 0 0 1 .85.85v8.6a.85.85 0 0 1-.85.85h-14a.85.85 0 0 1-.85-.85V5.2a.85.85 0 0 1 .85-.85m0 1.7L9.5 10.2l7-4.15H2.5m13.3 1.38-5.98 3.55a.85.85 0 0 1-.84 0L2.5 7.43v6.37h14V7.43"
        clipRule="evenodd"
      />
    </svg>
  )
}

const SOCIAL_ICONS = {
  'github-icon': GitHubIcon,
  'linkedin-icon': LinkedInIcon,
  'x-icon': XIcon,
  'email-icon': EmailIcon,
}

export default function NavSocialLinks() {
  const { t } = useLocale()
  const links = getSocialLinks()

  if (links.length === 0) return null

  return (
    <nav className="nav-social" aria-label={t('nav.social')}>
      <ul className="nav-social__list">
        {links.map((item) => {
          const labelKey = SOCIAL_LABEL_KEYS[item.id]
          const label = labelKey ? t(labelKey) : item.id
          const Icon = SOCIAL_ICONS[item.icon]
          const isExternal = item.href.startsWith('http')

          return (
            <li key={item.id}>
              <a
                href={item.href}
                className="nav-social__link"
                {...(isExternal
                  ? { target: '_blank', rel: 'noreferrer me' }
                  : {})}
                aria-label={label}
                title={label}
              >
                {Icon ? <Icon /> : null}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

'use client'

import { LOCALES } from '../../lib/i18n'
import { useLocale } from './LocaleProvider'

export function NavLocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="nav-locale" aria-label="Site language">
      {LOCALES.map((code, index) => (
        <span key={code} className="nav-locale__item">
          {index > 0 ? <span className="nav-locale__sep" aria-hidden="true">/</span> : null}
          <button
            type="button"
            className={code === locale ? 'nav-locale__btn nav-locale__btn--active' : 'nav-locale__btn'}
            onClick={() => setLocale(code)}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}

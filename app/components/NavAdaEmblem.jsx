import Link from 'next/link'
import ArcadePortalScene from './ArcadePortalScene'
import { SITE_NAME } from '../../lib/site'

export default function NavAdaEmblem() {
  return (
    <Link href="/" className="arcade-portal" aria-label={SITE_NAME}>
      <span className="arcade-portal__frame" aria-hidden="true">
        <span className="arcade-portal__viewport">
          <ArcadePortalScene />
        </span>
        <svg className="arcade-portal__arch" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 52V26C6 12 42 12 42 26V52"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M4 52H44" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      </span>
    </Link>
  )
}

import Link from 'next/link'

export default function AdminGovernanceAvatar({
  href,
  active = false,
  avatarUrl,
  initials,
  label,
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'gestalt-admin-avatar gestalt-admin-avatar--active'
          : 'gestalt-admin-avatar'
      }
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="gestalt-admin-avatar__photo" />
      ) : (
        <span className="gestalt-admin-avatar__initials" aria-hidden="true">
          {initials}
        </span>
      )}
    </Link>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { listPendingAccessRequests } from '@gestalt/auth'
import { useAuth } from './AuthProvider'

/**
 * Owner-only heads-up: when Alander opens the portfolio, surface any pending
 * Gestalt access requests filed from a product login (e.g. Deviante /no-access).
 * Approval stays in the database (SQL) — this only notifies and lists them.
 */
export default function AccessRequestsNotice() {
  const { isOwner, authReady } = useAuth()
  const [requests, setRequests] = useState([])
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!authReady || !isOwner) return undefined
    let active = true
    listPendingAccessRequests()
      .then((rows) => { if (active) setRequests(rows) })
      .catch(() => { /* RLS/owner check may not be ready — silent */ })
    return () => { active = false }
  }, [authReady, isOwner])

  if (!isOwner || dismissed || requests.length === 0) return null

  const count = requests.length
  const label = count === 1
    ? '1 pedido de acesso pendente'
    : `${count} pedidos de acesso pendentes`

  return (
    <aside className="access-notice" role="status" aria-live="polite">
      <button
        type="button"
        className="access-notice__head"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="access-notice__badge">{count}</span>
        <span className="access-notice__label">{label}</span>
        <span className="access-notice__chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open ? (
        <ul className="access-notice__list">
          {requests.map((request) => (
            <li key={request.id} className="access-notice__item">
              <span className="access-notice__email">{request.email}</span>
              {request.message ? (
                <p className="access-notice__message">{request.message}</p>
              ) : null}
              <time className="access-notice__date" dateTime={request.created_at}>
                {new Date(request.created_at).toLocaleDateString('pt-BR')}
              </time>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="access-notice__dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Ocultar aviso"
      >
        ×
      </button>
    </aside>
  )
}

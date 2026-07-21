'use client'

/**
 * Vendored copy of ui/gamifier/GamifierHud.jsx — the portfolio's CI only
 * checks out this repo (no sibling ui/ from the gestalt-hub monorepo), so
 * this can't be a cross-repo import. Keep in sync by hand with
 * ui/gamifier/GamifierHud.jsx (same reason lib/gestalt-auth mirrors ui/auth
 * instead of importing it directly — see doc/agents/gamifier.md).
 */

import { useState } from 'react'

const QUEST_STATUS = { DONE: 'done', ACTIVE: 'active', LOCKED: 'locked' }

const STATUS_ICON = {
  [QUEST_STATUS.DONE]: '★',
  [QUEST_STATUS.ACTIVE]: '▶',
  [QUEST_STATUS.LOCKED]: '·',
}

/** Umbrella products (partials/portfolio-completion.md) — IO, DV, MB, HA. */
const UMBRELLA_PRODUCT_CODES = ['IO', 'DV', 'MB', 'HA']

/**
 * Prefer the persistent, trigger-maintained value from
 * portfolio.gestalt_version (gradual 0.xx toward 1.0 — see
 * data/schema/portfolio/gestalt_version.sql). Falls back to a coarse
 * pré-v1/v1 label only if that row hasn't loaded yet (first paint, or
 * Supabase unreachable) — never computed as the primary source.
 */
function formatVersionLabel(gestaltVersion, products) {
  if (gestaltVersion) {
    const value = Number(gestaltVersion.version)
    return value >= 1 ? 'v1.0' : `v${value.toFixed(2)}`
  }
  const scoped = products.filter((product) => UMBRELLA_PRODUCT_CODES.includes(product.code))
  if (scoped.length === 0) return 'pré-v1'
  return scoped.every((product) => product.v1ApprovedAt) ? 'v1' : 'pré-v1'
}

function ProductSection({ product, open, onToggle }) {
  return (
    <section className="gamifier-hud__product">
      <button
        type="button"
        className="gamifier-hud__product-toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="gamifier-hud__product-name">{product.name}</span>
        <span className="gamifier-hud__product-score">
          {product.done}/{product.total} · {product.percent}%
        </span>
      </button>

      {open ? (
        <div className="gamifier-hud__phases">
          {product.phases.map((phase) => (
            <div key={phase.id} className="gamifier-hud__phase">
              <h4>
                <span>{phase.id}</span> {phase.codename}
                <small>{phase.label}</small>
              </h4>
              <ul>
                {phase.quests.map((quest) => (
                  <li
                    key={quest.id}
                    className={`gamifier-hud__quest gamifier-hud__quest--${quest.status}`}
                  >
                    <span className="gamifier-hud__icon" aria-hidden="true">
                      {STATUS_ICON[quest.status]}
                    </span>
                    {quest.uc ? <span className="gamifier-hud__uc">UC{quest.uc}</span> : null}
                    <span className="gamifier-hud__label">{quest.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

/**
 * Permanent, production-visible quest log — the public counterpart to
 * `@gestalt/dev-quest`'s `DevQuestHud`. Never gated: this is meant to be
 * seen by owner and visitors alike, on every Gestalt product site.
 */
export default function GamifierHud({ products, label = 'QUEST LOG', gestaltVersion = null }) {
  const [open, setOpen] = useState(false)
  const [openProduct, setOpenProduct] = useState(products[0]?.code ?? null)

  if (!products.length) return null

  const scopedProducts = products.filter((product) => UMBRELLA_PRODUCT_CODES.includes(product.code))
  const scoreProducts = scopedProducts.length > 0 ? scopedProducts : products
  const done = scoreProducts.reduce((sum, product) => sum + product.done, 0)
  const total = scoreProducts.reduce((sum, product) => sum + product.total, 0)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const versionLabel = formatVersionLabel(gestaltVersion, products)

  return (
    <div className={`gamifier-hud${open ? ' gamifier-hud--open' : ''}`}>
      <button
        type="button"
        className="gamifier-hud__toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Fechar quest log' : 'Abrir quest log'}
      >
        <span className="gamifier-hud__toggle-label">{label}</span>
        <span className="gamifier-hud__toggle-version">GESTALT {versionLabel}</span>
        <span className="gamifier-hud__toggle-xp">{percent}%</span>
      </button>

      {open ? (
        <div className="gamifier-hud__panel">
          <header className="gamifier-hud__header">
            <div>
              <p className="gamifier-hud__eyebrow">
                GESTALT <span className="gamifier-hud__version">{versionLabel}</span>
              </p>
              <h3>Progressão dos produtos</h3>
            </div>
            <p className="gamifier-hud__score">{done}/{total} quests</p>
          </header>

          <div className="gamifier-hud__xp" aria-hidden="true">
            <span className="gamifier-hud__xp-fill" style={{ width: `${percent}%` }} />
          </div>

          <div className="gamifier-hud__products">
            {products.map((product) => (
              <ProductSection
                key={product.code}
                product={product}
                open={openProduct === product.code}
                onToggle={() =>
                  setOpenProduct((current) => (current === product.code ? null : product.code))
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  getActiveQuest,
  getAllProductsUseCaseProgress,
  getFilteredRoadmap,
  getRoadmapProgress,
  getUseCaseProgress,
  mergeUseCaseProgressWithSpecs,
} from '../../lib/roadmap'
import UseCaseProductFilter from './UseCaseProductFilter'
import { PublicationBeacon, PublicationBeaconMenu } from './PublicationBeacon'
import { useLocale } from './LocaleProvider'
import { useRoadmap } from './RoadmapProvider'

const SPEC_TO_GESTALT = {
  io: 'IO',
  deviante: 'DV',
  milebrick: 'MB',
  harpia: 'HA',
}

function UcEditIcon({ className = '' }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 12 12">
      <path
        fill="currentColor"
        d="M8.2 1.8 10.2 3.8 4.5 9.5 2.2 10.2 2.9 7.9 8.2 1.8zM1 11h10v1H1v-1z"
      />
    </svg>
  )
}

function UcChevronIcon({ className = '' }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 12 12">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.1 2.1 4.1 6 8.1 9.9"
      />
    </svg>
  )
}

const UC_EXPAND_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const UC_EXPAND_DURATION = '0.46s'
const UC_EXPAND_OPACITY_DURATION = '0.34s'
const UC_EXPAND_OFFSET = '-0.4rem'

function ucExpandTransition() {
  return [
    `height ${UC_EXPAND_DURATION} ${UC_EXPAND_EASE}`,
    `opacity ${UC_EXPAND_OPACITY_DURATION} ease`,
    `transform ${UC_EXPAND_DURATION} ${UC_EXPAND_EASE}`,
  ].join(', ')
}

function UcExpandPanel({ id, className, ariaLabel, open, onClosed, children }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const wasOpenRef = useRef(false)
  const onClosedRef = useRef(onClosed)
  onClosedRef.current = onClosed

  // Only `open` drives enter/exit. Do NOT depend on `children` — parent
  // re-renders were restarting height 0→N and causing expand flicker.
  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = open

    const clearInlineStyles = () => {
      outer.style.removeProperty('height')
      outer.style.removeProperty('opacity')
      outer.style.removeProperty('transform')
      outer.style.removeProperty('transition')
      outer.style.removeProperty('overflow')
    }

    if (reducedMotion) {
      clearInlineStyles()
      outer.dataset.expandState = open ? 'open' : 'idle'
      if (!open && wasOpen) onClosedRef.current?.()
      return undefined
    }

    let frame = 0
    let finished = false

    const finishClose = () => {
      if (finished) return
      finished = true
      // Do NOT clearInlineStyles() here: the panel is about to unmount (via
      // onClosed → mounted=false), which happens on React's next commit, not
      // synchronously. Clearing height/overflow now drops the collapsed
      // 0px/hidden state immediately, so the browser paints the full,
      // unclipped content for a frame before React removes it — reads as the
      // description card flashing back open right after you close it.
      outer.dataset.expandState = 'idle'
      onClosedRef.current?.()
    }

    const onTransitionEnd = (event) => {
      if (event.target !== outer || event.propertyName !== 'height') return
      if (open) {
        outer.style.height = 'auto'
        outer.style.overflow = 'visible'
        outer.style.removeProperty('transition')
        outer.style.removeProperty('transform')
        outer.style.removeProperty('opacity')
        outer.dataset.expandState = 'open'
        return
      }
      finishClose()
    }

    outer.addEventListener('transitionend', onTransitionEnd)

    if (open) {
      const targetHeight = inner.scrollHeight
      outer.dataset.expandState = wasOpen ? 'open' : 'opening'

      if (wasOpen) {
        // Already open — keep settled; ResizeObserver below adjusts height.
        outer.style.height = 'auto'
        outer.style.opacity = '1'
        outer.style.transform = 'translateY(0)'
        outer.style.overflow = 'visible'
        return () => {
          outer.removeEventListener('transitionend', onTransitionEnd)
        }
      }

      outer.style.overflow = 'hidden'
      outer.style.height = '0px'
      outer.style.opacity = '0'
      outer.style.transform = `translateY(${UC_EXPAND_OFFSET})`
      outer.style.transition = ucExpandTransition()

      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          outer.style.height = `${targetHeight}px`
          outer.style.opacity = '1'
          outer.style.transform = 'translateY(0)'
        })
      })

      return () => {
        cancelAnimationFrame(frame)
        outer.removeEventListener('transitionend', onTransitionEnd)
      }
    }

    if (!wasOpen) {
      return () => {
        outer.removeEventListener('transitionend', onTransitionEnd)
      }
    }

    outer.dataset.expandState = 'closing'
    const startHeight = outer.getBoundingClientRect().height || inner.scrollHeight
    outer.style.overflow = 'hidden'
    outer.style.height = `${startHeight}px`
    outer.style.opacity = '1'
    outer.style.transform = 'translateY(0)'
    outer.style.transition = 'none'
    void outer.offsetHeight
    outer.style.transition = ucExpandTransition()

    frame = requestAnimationFrame(() => {
      outer.style.height = '0px'
      outer.style.opacity = '0'
      outer.style.transform = `translateY(${UC_EXPAND_OFFSET})`
    })

    const fallbackTimer = window.setTimeout(finishClose, 520)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(fallbackTimer)
      outer.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [open])

  // While open, grow/shrink with content without replaying enter animation.
  useLayoutEffect(() => {
    if (!open) return undefined
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner || typeof ResizeObserver === 'undefined') return undefined

    const syncHeight = () => {
      if (outer.dataset.expandState !== 'open') return
      if (outer.style.height === 'auto' || !outer.style.height) return
      outer.style.height = `${inner.scrollHeight}px`
    }

    const ro = new ResizeObserver(syncHeight)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [open])

  return (
    <div
      ref={outerRef}
      id={id}
      className={className}
      role="region"
      aria-label={ariaLabel}
      data-expand-state="idle"
    >
      <div ref={innerRef} className="build-progress__uc-expand-inner">
        {children}
      </div>
    </div>
  )
}

// Row shell must stay visually "active" (sticky, highlighted) for as long as
// the panel is still animating closed — isOpen flips instantly on click, but
// the panel takes ~460ms to collapse. Snapping the row's sticky/background
// state off in that same instant, while the still-visible panel keeps
// smoothly shrinking below it, is what reads as a blink/jump on close.
// `mounted` (from UcExpandPanel's own onClosed) tracks the real animation
// end, not just the logical selection change.
function UcListItemActive({ isOpen, children }) {
  const [mounted, setMounted] = useState(isOpen)

  useLayoutEffect(() => {
    if (isOpen) setMounted(true)
  }, [isOpen])

  const handleClosed = useCallback(() => {
    setMounted(false)
  }, [])

  return children({ showActive: isOpen || mounted, mounted, handleClosed })
}

function formatUcRowId(entry, spec, productFilter) {
  if (spec?.abpId) return spec.abpId
  if (spec?.shortId) return spec.shortId
  const gestaltCode = entry.productCode ?? (productFilter !== 'all' ? productFilter : null)
  if (!gestaltCode) return `UC${entry.uc}`
  return `ABP-${gestaltCode}-UC${entry.uc}`
}

function ucRowKey(entry, productFilter) {
  if (productFilter === 'all' && entry.productCode) {
    return `${entry.productCode}-${entry.uc}`
  }
  return String(entry.uc)
}

function ucSpecLookupKey(entry, item) {
  if (entry.productCode) return `${entry.productCode}-${entry.uc}`
  if (item?.productCode) {
    const gestaltCode = SPEC_TO_GESTALT[item.productCode] ?? item.productCode
    return `${gestaltCode}-${item.ucNumber}`
  }
  return String(entry.uc)
}

const ARCADE_BAR_SEG_CAP = 14

function readRootRemPx(multiplier) {
  if (typeof window === 'undefined') return multiplier * 16
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return rootSize * multiplier
}

function measureArcadeSlotCount(bar) {
  if (!bar) return ARCADE_BAR_SEG_CAP

  const styles = getComputedStyle(bar)
  const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
  const gap = parseFloat(styles.columnGap || styles.gap) || 2
  const innerWidth = Math.max(0, bar.clientWidth - paddingX)
  const segMax = readRootRemPx(0.52)

  return Math.max(1, Math.ceil((innerWidth + gap) / (segMax + gap)))
}

function getArcadeSegmentState(done, total, slotCount) {
  const count = slotCount
  const filled =
    total <= 0
      ? 0
      : Math.min(count, Math.round((done / total) * count))
  return { count, filled }
}

function ArcadeSegmentBar({ done, total, className = '' }) {
  const barRef = useRef(null)
  const [slotCount, setSlotCount] = useState(ARCADE_BAR_SEG_CAP)

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return undefined

    const syncSlotCount = () => {
      const next = measureArcadeSlotCount(bar)
      setSlotCount((prev) => (prev === next ? prev : next))
    }

    syncSlotCount()

    const observer = new ResizeObserver(syncSlotCount)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  const { count, filled } = getArcadeSegmentState(done, total, slotCount)

  return (
    <span
      ref={barRef}
      className={['arcade-seg-bar', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={
            index < filled
              ? 'arcade-seg-bar__cell arcade-seg-bar__cell--on'
              : 'arcade-seg-bar__cell'
          }
        />
      ))}
    </span>
  )
}

export default function BuildProgress({
  detailed = false,
  productFilter = 'all',
  onProductFilterChange,
  useCases = [],
  selectedUcKey = null,
  onSelectUc,
  onEditUc = null,
  onUpdateUcStatus = null,
  ucListPrefix = null,
  renderUcFolio = null,
  useCasesLoading = false,
  toolbarActions = null,
  ownerDbAccess = false,
}) {
  const { t } = useLocale()
  const { roadmap } = useRoadmap()

  const { phases, lifecycle: filteredLifecycle } = getFilteredRoadmap(productFilter, roadmap)
  const { done, total, percent } = getRoadmapProgress(phases)
  const activeQuest = getActiveQuest(phases)
  const ucProgress = useMemo(() => {
    const base =
      productFilter === 'all' ? getAllProductsUseCaseProgress(roadmap) : getUseCaseProgress(phases)
    return mergeUseCaseProgressWithSpecs(base, useCases, productFilter)
  }, [phases, productFilter, useCases, roadmap])

  const filteredUseCaseCount = useMemo(() => {
    if (productFilter === 'all') return useCases.length
    const specCode = Object.entries(SPEC_TO_GESTALT).find(([, code]) => code === productFilter)?.[0]
    if (!specCode) return 0
    return useCases.filter((item) => item.productCode === specCode).length
  }, [productFilter, useCases])

  const useCaseByKey = useMemo(() => {
    const map = new Map()
    for (const item of useCases) {
      const key = productFilter === 'all'
        ? ucSpecLookupKey({ uc: item.ucNumber, productCode: SPEC_TO_GESTALT[item.productCode] }, item)
        : String(item.ucNumber)
      map.set(key, item)
    }
    return map
  }, [productFilter, useCases])

  const isDesigning = filteredLifecycle === 'designing' && total === 0 && filteredUseCaseCount === 0
  const specsAvailable = useCases.length > 0
  const showProgressBar = productFilter !== 'all' || total > 0
  const hasEditColumn = Boolean(ownerDbAccess && onEditUc)
  const xpOnBarRow = detailed && showProgressBar
  const xpLabel = isDesigning || percent == null ? '—' : `${done}/${total} ${percent}%`
  const ucListSwapRef = useRef(null)
  const skipUcListSwapAnim = useRef(true)

  useEffect(() => {
    if (skipUcListSwapAnim.current) {
      skipUcListSwapAnim.current = false
      return
    }
    const node = ucListSwapRef.current
    if (!node) return
    node.classList.remove('build-progress__uc-list-wrap--swap')
    void node.offsetWidth
    node.classList.add('build-progress__uc-list-wrap--swap')
  }, [productFilter])

  return (
    <aside
      className="build-progress build-progress--cases"
      aria-label={t('progress.label')}
    >
      {showProgressBar ? (
        xpOnBarRow ? (
          <div className="build-progress__bar-row">
            <div
              className="build-progress__bar"
              role="progressbar"
              aria-valuenow={percent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <ArcadeSegmentBar done={done} total={total} />
            </div>
            <span className="build-progress__xp">{xpLabel}</span>
          </div>
        ) : (
          <div
            className="build-progress__bar"
            role="progressbar"
            aria-valuenow={percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <ArcadeSegmentBar done={done} total={total} />
          </div>
        )
      ) : null}

      <div className="build-progress__stamp">
        <div className="build-progress__stamp-meta">
          <span className="build-progress__coin" aria-hidden="true">◎</span>
          {productFilter === 'all' ? (
            <span className="build-progress__phase">GESTALT</span>
          ) : (
            <>
              <span className="build-progress__phase">{productFilter}</span>
              {filteredLifecycle ? (
                <span className={`build-progress__lifecycle build-progress__lifecycle--${filteredLifecycle}`}>
                  {t(`progress.lifecycle.${filteredLifecycle}`)}
                </span>
              ) : null}
            </>
          )}
          <span className="build-progress__sep">·</span>
          <span className="build-progress__quest">
            {isDesigning
              ? t('progress.designingPhase')
              : activeQuest
                ? `${activeQuest.id} ${activeQuest.label}`
                : t('progress.allClear')}
          </span>
        </div>
        {!xpOnBarRow ? (
          <span className="build-progress__xp">{xpLabel}</span>
        ) : null}
      </div>

      {onProductFilterChange ? (
        <div className="build-progress__cases-toolbar">
          <UseCaseProductFilter value={productFilter} onChange={onProductFilterChange} />
          {toolbarActions ? (
            <div className="build-progress__cases-toolbar-actions">{toolbarActions}</div>
          ) : null}
        </div>
      ) : null}

      {detailed ? (
        <div className="build-progress__detail">
          {ucListPrefix}

          {!isDesigning && ucProgress.length > 0 ? (
            <div ref={ucListSwapRef} className="build-progress__uc-list-wrap">
              <ul className="build-progress__uc-list">
                {ucProgress.map((entry) => {
                  const lookupKey = productFilter === 'all'
                    ? `${entry.productCode}-${entry.uc}`
                    : String(entry.uc)
                  const spec = useCaseByKey.get(lookupKey)
                  const rowKey = ucRowKey(entry, productFilter)
                  const isOpen = selectedUcKey === rowKey
                  const canOpen = specsAvailable && spec
                  const rowId = formatUcRowId(entry, spec, productFilter)
                  const canEdit = hasEditColumn && onEditUc && canOpen

                  return (
                    <UcListItemActive key={`uc-${rowKey}`} isOpen={isOpen}>
                      {({ showActive, mounted, handleClosed }) => {
                        const shellClass = [
                          'build-progress__uc-row-shell',
                          hasEditColumn && 'build-progress__uc-row-shell--product',
                          showActive && 'build-progress__uc-row-shell--active',
                          canEdit && 'build-progress__uc-row-shell--editable',
                          !canOpen && 'build-progress__uc-row-shell--disabled',
                        ]
                          .filter(Boolean)
                          .join(' ')
                        const itemClass = [
                          'build-progress__uc-item',
                          showActive && 'build-progress__uc-item--open',
                        ]
                          .filter(Boolean)
                          .join(' ')

                        return (
                          <li className={itemClass}>
                            <div className={shellClass}>
                              <span className="build-progress__uc-id">
                                {spec ? (
                                  onUpdateUcStatus && spec.id ? (
                                    <PublicationBeaconMenu
                                      status={spec.status}
                                      visibility={spec.visibility}
                                      className="build-progress__uc-beacon"
                                      onChange={(next) => onUpdateUcStatus(spec.id, next)}
                                    />
                                  ) : (
                                    <PublicationBeacon
                                      status={spec.status}
                                      visibility={spec.visibility}
                                      className="build-progress__uc-beacon"
                                    />
                                  )
                                ) : null}
                                {rowId}
                              </span>
                              <button
                                type="button"
                                className="build-progress__uc-row"
                                disabled={!canOpen}
                                aria-expanded={isOpen}
                                aria-controls={canOpen ? `uc-expand-${rowKey}` : undefined}
                                onClick={() => {
                                  if (!canOpen) return
                                  onSelectUc?.(
                                    entry.uc,
                                    productFilter === 'all' ? entry.productCode : undefined,
                                  )
                                }}
                              >
                                <span className="build-progress__uc-label">
                                  {spec?.title ? spec.title : `UC${entry.uc}`}
                                </span>
                                <span className="build-progress__uc-bar" aria-hidden="true">
                                  <span style={{ width: `${entry.percent}%` }} />
                                </span>
                                <span className="build-progress__uc-xp">{entry.done}/{entry.total}</span>
                              </button>
                              {hasEditColumn ? (
                                <>
                                  {canEdit ? (
                                    <button
                                      type="button"
                                      className="build-progress__uc-edit"
                                      aria-label={t('useCasesSpec.edit')}
                                      title={t('useCasesSpec.edit')}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        onEditUc?.(
                                          entry.uc,
                                          productFilter === 'all' ? entry.productCode : undefined,
                                        )
                                      }}
                                    >
                                      <UcEditIcon className="build-progress__uc-edit-icon" />
                                    </button>
                                  ) : (
                                    <span className="build-progress__uc-edit-slot" aria-hidden="true" />
                                  )}
                                  <span
                                    className={`build-progress__uc-chevron${isOpen ? ' build-progress__uc-chevron--open' : ''}`}
                                    aria-hidden="true"
                                    onClick={() => {
                                      if (!canOpen) return
                                      onSelectUc?.(
                                        entry.uc,
                                        productFilter === 'all' ? entry.productCode : undefined,
                                      )
                                    }}
                                  >
                                    <UcChevronIcon className="build-progress__uc-chevron-icon" />
                                  </span>
                                </>
                              ) : null}
                            </div>
                            {spec && renderUcFolio && mounted ? (
                              <div className="build-progress__uc-expand-item">
                                <UcExpandPanel
                                  id={`uc-expand-${rowKey}`}
                                  className="build-progress__uc-expand"
                                  ariaLabel={spec.title}
                                  open={isOpen}
                                  onClosed={handleClosed}
                                >
                                  {renderUcFolio(
                                    entry.uc,
                                    spec,
                                    productFilter === 'all' ? entry.productCode : undefined,
                                  )}
                                </UcExpandPanel>
                              </div>
                            ) : null}
                          </li>
                        )
                      }}
                    </UcListItemActive>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {useCasesLoading ? (
            <p className="muted">{t('misc.loading')}</p>
          ) : null}

          {isDesigning ? (
            <p className="build-progress__designing-note">{t('progress.designingNote')}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}

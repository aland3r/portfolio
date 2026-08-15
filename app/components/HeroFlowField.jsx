'use client'

import { useEffect, useRef } from 'react'

// Flow-fields ponto-a-ponto do tweet (peixe e água-viva), em canvas 2D puro
// (mesma fórmula, sem p5). A cada carregamento sorteia 1 de 3 variantes; todas
// com escala UNIFORME (proporcional) num canvas que preenche a tela inteira
// exceto o header:
//   • cover   → max(W/spanX, H/spanY): a figura preenche a tela (recorta sobra)
//   • contain → min(W/spanX, H/spanY): a figura inteira aparece (visão completa)
const COUNT = 1e4

const FIELDS = {
  peixe: {
    tStep: Math.PI /80,
    alpha: 0.80, // stroke(255, 96)
    point(i, t) {
      const y = i / 253
      const k = 5 * Math.cos(i / 56)
      const e = y / 3 - 16
      const d = Math.hypot(k, e) / 3
      const c = d / 2 - t / 3
      return [
        (d * 19 + 29 + k * k) * Math.sin(c) + 200,
        66 * Math.sin(c / 3) +
          4 * Math.sin(k * 2) +
          (d ** 3 / 3) * Math.sin(t * 3 - d * d / 4) +
          (y / (y < 9 ? 7 : 203 * Math.sin(e / 2))) * k * e +
          200,
      ]
    },
  },
  aguaViva: {
    tStep: Math.PI / 240,
    alpha: 0.455, // stroke(255, 116)
    point(i, t) {
      const y = i / 295
      const k = (5 + Math.sin(y * 2 - t / 2) * 2) * Math.cos(i / 29)
      const e = y / 7 - 13
      const d = Math.hypot(k, e) - 6
      const q =
        3 * Math.sin(k * 2) +
        Math.cos(y) / k +
        Math.sin(y / 25) * k * (9 + 4 * Math.sin(e * 9 - d * 3 + t * 2))
      const c = d - t
      return [q + 50 * Math.cos(c) + 200, q * Math.sin(c) + d * 39]
    },
  },
}

const VARIANTS = {
  peixe: { field: FIELDS.peixe, fit: 'contain', zoom: 1 },
  aguaVivaCompleta: { field: FIELDS.aguaViva, fit: 'contain', zoom: 0.85 },
  // água-viva zoom vive na tela /apps, de cabeça pra baixo (flipY).
  aguaVivaZoom: { field: FIELDS.aguaViva, fit: 'cover', zoom: 0.85, flipY: true },
}

// Home sorteia entre estas 2; /apps passa variant="aguaVivaZoom".
const HOME_POOL = ['peixe', 'aguaVivaCompleta']

// Centro + spans por percentil [lo, hi] no espaço da figura (independente da
// tela → responsivo). Percentil fechado (núcleo denso) para cover, largo para
// contain. O centro/extensão horizontal usa só os pontos dentro da banda
// vertical, mantendo a figura centrada e as laterais sem folga.
function bounds(field, lo, hi) {
  const pts = []
  for (let s = 0; s < 90; s++) {
    const tt = s * field.tStep * 3
    for (let i = COUNT; i > 0; i -= 7) {
      const p = field.point(i, tt)
      if (Number.isFinite(p[0]) && Number.isFinite(p[1])) pts.push(p)
    }
  }
  const q = (a, p) =>
    a[Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))))]
  const ys = pts.map((p) => p[1]).sort((a, b) => a - b)
  const cy = (q(ys, lo) + q(ys, hi)) / 2
  const spanY = Math.max(1, q(ys, hi) - q(ys, lo))
  const xs = pts
    .filter((p) => Math.abs(p[1] - cy) <= spanY)
    .map((p) => p[0])
    .sort((a, b) => a - b)
  return {
    cx: (q(xs, lo) + q(xs, hi)) / 2,
    cy,
    spanX: Math.max(1, q(xs, hi) - q(xs, lo)),
    spanY,
  }
}

export default function HeroFlowField({ variant, spacer = true }) {
  const canvasRef = useRef(null)
  const bgRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const bg = bgRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !bg) return

    // Altura do header → topo do canvas (responsivo, sem número mágico).
    const header = document.querySelector('.gestalt-header')
    const syncTop = () => {
      const h = header ? Math.round(header.getBoundingClientRect().height) : 63
      bg.style.setProperty('--hero-anim-top', `${h}px`)
    }
    syncTop()
    window.addEventListener('resize', syncTop)

    const key = variant || HOME_POOL[Math.floor(Math.random() * HOME_POOL.length)]
    const v = VARIANTS[key]
    canvas.dataset.sketch = key
    // contain (completas) → largo (0.01–0.99): figura inteira.
    // cover (zoom) → núcleo denso (0.15–0.85): o corpo preenche a tela.
    const { cx, cy, spanX, spanY } =
      v.fit === 'contain' ? bounds(v.field, 0.01, 0.99) : bounds(v.field, 0.15, 0.85)
    const { point, tStep, alpha } = v.field
    const fill = `rgba(255,255,255,${alpha})`
    const fy = v.flipY ? -1 : 1 // de cabeça pra baixo

    let t = 0
    let raf = 0

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = (canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr)))
      const H = (canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr)))
      const dot = Math.max(1, dpr * 1.5) // meio-termo: visível sem ficar grosso
      const s =
        (v.fit === 'contain'
          ? Math.min(W / spanX, H / spanY) * 0.95
          : Math.max(W / spanX, H / spanY)) * v.zoom

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = fill
      t += tStep
      for (let i = COUNT; i--; ) {
        const [x, y] = point(i, t)
        ctx.fillRect(W / 2 + (x - cx) * s, H / 2 + (y - cy) * s * fy, dot, dot)
      }
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      draw()
      const ro = new ResizeObserver(draw)
      ro.observe(canvas)
      return () => {
        ro.disconnect()
        window.removeEventListener('resize', syncTop)
      }
    }
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', syncTop)
    }
  }, [variant])

  return (
    <>
      {/* Fundo fixo: preenche a tela (exceto header), atrás do conteúdo. */}
      <div ref={bgRef} className="home-flowfield-bg" aria-hidden="true">
        <canvas ref={canvasRef} className="home-flowfield__canvas" />
      </div>
      {/* Espaçador em fluxo (só na home): mantém o layout/espaçamento. */}
      {spacer && <div className="home-flowfield" aria-hidden="true" />}
    </>
  )
}

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

// Zoom < 1: a figura não alcança a amplitude completa da tela (deixa margem
// pro texto respirar). O peixe fica um pouco maior — linhas horizontais mais
// longas — que a água-viva.
const VARIANTS = {
  peixe: { field: FIELDS.peixe, fit: 'contain', zoom: 0.95 },
  aguaVivaCompleta: { field: FIELDS.aguaViva, fit: 'contain', zoom: 0.88 },
}

// Home sorteia entre estas 2.
const HOME_POOL = ['peixe', 'aguaVivaCompleta']

// Centro + spans por percentil [lo, hi] no espaço da figura (independente da
// tela → responsivo). Amostra t o bastante pra cobrir a rotação completa da
// figura, então o bounding-box VARRIDO fica simétrico e a figura centraliza —
// margens laterais iguais dos dois lados.
function bounds(field, lo, hi) {
  const pts = []
  for (let s = 0; s < 220; s++) {
    const tt = s * field.tStep * 4
    for (let i = COUNT; i > 0; i -= 9) {
      const p = field.point(i, tt)
      if (Number.isFinite(p[0]) && Number.isFinite(p[1])) pts.push(p)
    }
  }
  const q = (a, p) =>
    a[Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))))]
  const xs = pts.map((p) => p[0]).sort((a, b) => a - b)
  const ys = pts.map((p) => p[1]).sort((a, b) => a - b)
  return {
    cx: (q(xs, lo) + q(xs, hi)) / 2,
    cy: (q(ys, lo) + q(ys, hi)) / 2,
    spanX: Math.max(1, q(xs, hi) - q(xs, lo)),
    spanY: Math.max(1, q(ys, hi) - q(ys, lo)),
  }
}

export default function HeroFlowField() {
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

    const key = HOME_POOL[Math.floor(Math.random() * HOME_POOL.length)]
    const v = VARIANTS[key]
    canvas.dataset.sketch = key
    // Figura inteira (percentil largo).
    const { cx, cy, spanX, spanY } = bounds(v.field, 0.01, 0.99)
    const { point, tStep } = v.field

    let t = 0
    let raf = 0

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = (canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr)))
      const H = (canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr)))
      const dot = Math.max(1, dpr * 1.5)
      const s = Math.min(W / spanX, H / spanY) * 0.95 * v.zoom

      // Fundo discreto: gradiente cinza → cinza escuro, opacidade baixa, pra
      // dar menos destaque e não competir com o texto.
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, 'rgba(205,205,205,0.55)')
      grad.addColorStop(1, 'rgba(115,115,115,0.34)')

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = grad
      t += tStep
      for (let i = COUNT; i--; ) {
        const [x, y] = point(i, t)
        ctx.fillRect(W / 2 + (x - cx) * s, H / 2 + (y - cy) * s, dot, dot)
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
  }, [])

  return (
    <>
      {/* Fundo fixo: preenche a tela (exceto header), atrás do conteúdo. */}
      <div ref={bgRef} className="home-flowfield-bg" aria-hidden="true">
        <canvas ref={canvasRef} className="home-flowfield__canvas" />
      </div>
      {/* Espaçador em fluxo: mantém o layout/espaçamento. */}
      <div className="home-flowfield" aria-hidden="true" />
    </>
  )
}

'use client'

import { useEffect, useRef } from 'react'

// Flow-field ponto-a-ponto do tweet, reimplementado em canvas 2D puro
// (mesma fórmula, sem depender do p5). A figura original é um "cometa"
// vertical num espaço 400×400; aqui ela é girada 90° e esticada para varrer
// a extensão HORIZONTAL da tela, ocupando uma faixa full-bleed responsiva.
export default function HeroFlowField() {
  const holderRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const holder = holderRef.current
    const canvas = canvasRef.current
    if (!holder || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let t = 0
    let raf = 0
    let running = true

    // Backing store = tamanho real da faixa × DPR (limitado a 2 p/ perf).
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(holder.clientWidth * dpr))
      const h = Math.max(1, Math.round(holder.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      return dpr
    }

    const render = () => {
      const dpr = sync()
      const W = canvas.width
      const H = canvas.height
      const dot = Math.max(1, Math.round(dpr))

      // Eixo longo (0..400 original, na vertical) preenche a largura;
      // eixo curto é comprimido para caber na altura da faixa → elipse
      // deitada. Uma folga de 0.9 evita encostar nas bordas.
      const sx = (W / 400) * 0.9
      const sy = sx * 0.5
      const cx = W / 2
      const cy = H / 2

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,0.376)' // stroke(255, 96) do tweet

      t += Math.PI / 80

      for (let i = 1e4; i--; ) {
        const y = i / 253
        const k = 5 * Math.cos(i / 56)
        const e = y / 3 - 16
        const d = Math.hypot(k, e) / 3
        const c = d / 2 - t / 3
        const x = (d * 19 + 29 + k * k) * Math.sin(c) + 200
        const yy =
          66 * Math.sin(c / 3) +
          4 * Math.sin(k * 2) +
          (d ** 3 / 3) * Math.sin(t * 3 - d * d / 4) +
          (y / (y < 9 ? 7 : 203 * Math.sin(e / 2))) * k * e +
          200

        // Centraliza no espaço 400, gira 90° (vertical → horizontal) e escala.
        const lx = x - 200
        const ly = yy - 200
        const px = cx + ly * sx // eixo longo → horizontal
        const py = cy - lx * sy // eixo curto → vertical
        ctx.fillRect(px, py, dot, dot)
      }
    }

    const loop = () => {
      if (!running) return
      render()
      raf = requestAnimationFrame(loop)
    }

    if (reduceMotion) {
      // Motion reduzido: um quadro estático, redesenhado só em resize.
      render()
      const ro = new ResizeObserver(() => render())
      ro.observe(holder)
      return () => {
        running = false
        ro.disconnect()
      }
    }

    loop()
    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={holderRef} className="home-flowfield" aria-hidden="true">
      <canvas ref={canvasRef} className="home-flowfield__canvas" />
    </div>
  )
}

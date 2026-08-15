'use client'

import { useEffect, useRef } from 'react'

// Flow-field ponto-a-ponto do tweet, reimplementado em canvas 2D puro
// (mesma fórmula, sem depender do p5). A figura e o movimento são fiéis ao
// original — SEM rotação e SEM distorção: aplicamos apenas uma escala
// UNIFORME para que a extensão horizontal que a animação varre alcance as
// bordas laterais da tela. O excedente vertical é recortado pela faixa.
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

    // Meia-extensão horizontal máxima da nuvem de pontos. Como
    // x = amp·sin(c) + 200, o maior |x-200| possível é o maior `amp` sobre i
    // (sin varia em [-1,1] ao longo do tempo). Serve para escalar de modo que
    // a área varrida encoste nas duas bordas.
    let halfExtent = 1
    for (let i = 1e4; i--; ) {
      const y = i / 253
      const k = 5 * Math.cos(i / 56)
      const e = y / 3 - 16
      const d = Math.hypot(k, e) / 3
      const amp = d * 19 + 29 + k * k
      if (amp > halfExtent) halfExtent = amp
    }

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

      // Escala UNIFORME: a meia-largura da figura vira a meia-largura da tela,
      // então a varredura horizontal toca as bordas. Mesmo fator no vertical
      // preserva a proporção (fidelidade do movimento).
      const s = W / 2 / halfExtent
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
        ctx.fillRect(cx + (x - 200) * s, cy + (yy - 200) * s, dot, dot)
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

'use client'

import { useEffect, useRef } from 'react'

function lerp(a, b, t) {
  return a + (b - a) * t
}

function mixColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  }
}

function rgb({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`
}

function dayNightMix(t) {
  const cycle = (Math.sin(t * Math.PI * 2) + 1) / 2
  const night = { r: 10, g: 10, b: 18 }
  const dusk = { r: 40, g: 40, b: 48 }
  const day = { r: 170, g: 170, b: 170 }
  const sky = cycle > 0.5
    ? mixColor(dusk, day, (cycle - 0.5) * 2)
    : mixColor(night, dusk, cycle * 2)
  return { sky, cycle }
}

function drawCactus(ctx, x, baseY, w, h) {
  ctx.fillRect(x, baseY - h, w, h)
  ctx.fillRect(x - w, baseY - h * 0.55, w * 0.85, w * 0.7)
  ctx.fillRect(x + w * 0.15, baseY - h * 0.7, w * 0.85, w * 0.7)
}

/** Desert highway seen through the arcade arch — scrolls like driving forward. */
export default function ArcadePortalScene() {
  const canvasRef = useRef(null)
  const frameRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    startRef.current = performance.now()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    function draw(now) {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w <= 0 || h <= 0) {
        frameRef.current = requestAnimationFrame(draw)
        return
      }

      const elapsed = (now - startRef.current) / 1000
      const scroll = reducedMotion ? 0 : elapsed * 52
      const { sky, cycle } = dayNightMix(reducedMotion ? 0.7 : (elapsed / 40) % 1)

      const horizon = h * 0.5
      const roadTop = horizon + h * 0.06
      const roadBot = h

      const grad = ctx.createLinearGradient(0, 0, 0, horizon)
      grad.addColorStop(0, rgb(mixColor(sky, { r: 6, g: 6, b: 10 }, 0.4)))
      grad.addColorStop(1, rgb(sky))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, horizon)

      ctx.fillStyle = rgb(mixColor({ r: 34, g: 34, b: 34 }, { r: 82, g: 82, b: 82 }, cycle))
      ctx.fillRect(0, horizon, w, h - horizon)

      ctx.fillStyle = cycle > 0.45 ? '#f0f0f0' : '#777'
      ctx.beginPath()
      ctx.arc(w * 0.68, horizon * (0.18 + cycle * 0.22), 2 + cycle * 2.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = rgb(mixColor({ r: 16, g: 16, b: 16 }, { r: 36, g: 36, b: 36 }, cycle))
      ctx.beginPath()
      ctx.moveTo(w * 0.34, roadTop)
      ctx.lineTo(w * 0.66, roadTop)
      ctx.lineTo(w * 0.92, roadBot)
      ctx.lineTo(w * 0.08, roadBot)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = cycle > 0.4 ? '#f0f0f0' : '#555'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 5])
      ctx.lineDashOffset = -scroll * 2
      ctx.beginPath()
      ctx.moveTo(w * 0.5, roadTop + 1)
      ctx.lineTo(w * 0.5, roadBot - 1)
      ctx.stroke()
      ctx.setLineDash([])

      const cactusFill = rgb(mixColor({ r: 28, g: 28, b: 28 }, { r: 72, g: 72, b: 72 }, cycle))
      ctx.fillStyle = cactusFill
      const spacing = Math.max(14, w * 0.35)
      for (let i = -2; i < 6; i += 1) {
        const pass = i * spacing - (scroll % spacing)
        const leftX = w * 0.06 + pass * 0.22
        const rightX = w * 0.78 - pass * 0.18
        const cactusH = h * 0.2 + (i % 3) * 2
        if (leftX > -8 && leftX < w * 0.38) drawCactus(ctx, leftX, roadTop, 2.5, cactusH)
        if (rightX > w * 0.55 && rightX < w + 8) drawCactus(ctx, rightX, roadTop, 2.5, cactusH * 0.9)
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} className="arcade-portal__canvas" aria-hidden="true" />
}

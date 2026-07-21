'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useAuth } from './AuthProvider'

function drawRaptor(ctx, x, y, s, leg) {
  ctx.fillStyle = '#e8e8e8'
  ctx.fillRect(x, y, 10 * s, 5 * s)
  ctx.fillRect(x + 9 * s, y - 2 * s, 6 * s, 4 * s)
  ctx.fillRect(x - 7 * s, y + 1 * s, 7 * s, 2 * s)
  ctx.fillRect(x + 2 * s, y + 5 * s, 2 * s, 3 * s + leg)
  ctx.fillRect(x + 6 * s, y + 5 * s, 2 * s, 3 * s - leg)
}

function drawBronto(ctx, x, y, s, leg) {
  ctx.fillStyle = '#d8d8d8'
  ctx.fillRect(x, y + 2 * s, 14 * s, 4 * s)
  ctx.fillRect(x + 12 * s, y - 8 * s, 3 * s, 12 * s)
  ctx.fillRect(x + 13 * s, y - 10 * s, 5 * s, 3 * s)
  ctx.fillRect(x - 10 * s, y + 3 * s, 10 * s, 2 * s)
  ctx.fillRect(x + 3 * s, y + 6 * s, 2 * s, 4 * s + leg)
  ctx.fillRect(x + 9 * s, y + 6 * s, 2 * s, 4 * s - leg)
}

function drawStego(ctx, x, y, s, leg) {
  ctx.fillStyle = '#ececec'
  ctx.fillRect(x, y, 12 * s, 5 * s)
  ctx.fillRect(x + 10 * s, y - 1 * s, 5 * s, 4 * s)
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(x + 2 * s + i * 2.5 * s, y - 3 * s, 1.5 * s, 3 * s)
  }
  ctx.fillRect(x - 8 * s, y + 2 * s, 8 * s, 2 * s)
  ctx.fillRect(x + 2 * s, y + 5 * s, 2 * s, 3 * s + leg)
  ctx.fillRect(x + 7 * s, y + 5 * s, 2 * s, 3 * s - leg)
}

function drawTrike(ctx, x, y, s, leg) {
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(x + 2 * s, y, 10 * s, 5 * s)
  ctx.fillRect(x + 10 * s, y - 1 * s, 5 * s, 4 * s)
  ctx.fillRect(x, y - 2 * s, 3 * s, 3 * s)
  ctx.fillRect(x + 4 * s, y - 3 * s, 2 * s, 4 * s)
  ctx.fillRect(x + 8 * s, y - 3 * s, 2 * s, 4 * s)
  ctx.fillRect(x + 3 * s, y + 5 * s, 2 * s, 3 * s + leg)
  ctx.fillRect(x + 7 * s, y + 5 * s, 2 * s, 3 * s - leg)
}

const DINOS = [drawRaptor, drawBronto, drawStego, drawTrike]

export default function WelcomeDinoScene() {
  const sceneRef = useRef(null)
  const canvasRef = useRef(null)
  const frameRef = useRef(0)
  const startRef = useRef(0)
  const dinoDraw = useMemo(() => DINOS[Math.floor(Math.random() * DINOS.length)], [])
  const { isOwner, loading } = useAuth()

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
      const leg = reducedMotion ? 0 : Math.sin(elapsed * 8) * 1.5
      const bob = reducedMotion ? 0 : Math.sin(elapsed * 4) * 1

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)

      const scale = Math.min(w / 280, h / 140, 2.1)
      const groundY = h * 0.68
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, groundY, w, h - groundY)

      ctx.fillStyle = '#333'
      const cactusCount = Math.max(5, Math.round(w / 220))
      for (let i = 0; i < cactusCount; i += 1) {
        const cx = ((i + 0.35) / cactusCount) * w
        drawCactus(ctx, cx, groundY, Math.max(3, scale * 1.1), h * 0.14)
      }

      const dinoX = w * 0.42 - 24 * scale
      const dinoY = groundY - 14 * scale - bob * scale
      dinoDraw(ctx, dinoX, dinoY, scale, leg)

      frameRef.current = requestAnimationFrame(draw)
    }

    function drawCactus(c, x, baseY, cw, ch) {
      c.fillRect(x, baseY - ch, cw, ch)
      c.fillRect(x - cw, baseY - ch * 0.5, cw * 0.8, cw * 0.7)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [dinoDraw])

  return (
    <div ref={sceneRef} className="welcome-scene" aria-hidden="true">
      {isOwner && !loading ? (
        <p className="welcome-scene__insert-coin">INSERT COIN</p>
      ) : null}
      <canvas ref={canvasRef} className="welcome-scene__canvas" />
    </div>
  )
}

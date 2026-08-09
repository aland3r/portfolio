'use client'

import { useEffect, useRef, useState } from 'react'

/* Deterministic per-index hash so cactus fields tile the same every frame. */
function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/* Chunky pixel saguaro standing on (baseX, baseY). `f` = brightness factor. */
function drawCactus(ctx, baseX, baseY, u, bright) {
  const body = bright ? '#5fae52' : '#3f6b45'
  const shade = bright ? '#3f7d3a' : '#2f5133'
  ctx.fillStyle = body
  // trunk
  ctx.fillRect(baseX - u, baseY - u * 9, u * 2, u * 9)
  // left arm — elbow out from trunk, then the limb rises up
  ctx.fillRect(baseX - u * 3, baseY - u * 6, u * 3, u)
  ctx.fillRect(baseX - u * 3, baseY - u * 8, u, u * 2)
  // right arm — elbow out, rising a touch taller
  ctx.fillRect(baseX + u, baseY - u * 7, u * 2, u)
  ctx.fillRect(baseX + u * 2, baseY - u * 10, u, u * 3)
  // shade column
  ctx.fillStyle = shade
  ctx.fillRect(baseX + u * 0.4, baseY - u * 9, u * 0.6, u * 9)
}

/* Little pixel dinosaur, feet centered on (cx, groundY). `step` toggles legs. */
function drawDino(ctx, cx, groundY, u, step, moving, facing) {
  ctx.save()
  ctx.translate(cx, 0)
  if (facing < 0) ctx.scale(-1, 1)

  // White pixel silhouette on the transparent (black) ground — no belly, no eye.
  ctx.fillStyle = '#ffffff'

  // tail
  ctx.fillRect(-u * 8, groundY - u * 7, u * 4, u * 3)
  ctx.fillRect(-u * 9, groundY - u * 6, u * 2, u * 2)
  // body
  ctx.fillRect(-u * 6, groundY - u * 9, u * 10, u * 6)
  // head
  ctx.fillRect(u * 2, groundY - u * 13, u * 6, u * 6)
  ctx.fillRect(u * 7, groundY - u * 11, u * 2, u * 2) // snout
  // legs (animate only while moving)
  const swing = moving ? step : 0
  ctx.fillRect(-u * 2, groundY - u * 3, u * 1.8, u * 3 + swing)
  ctx.fillRect(u * 1.5, groundY - u * 3, u * 1.8, u * 3 - swing)

  ctx.restore()
}

export default function WelcomeDinoScene() {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const keys = useRef({ left: false, right: false })
  const world = useRef({ x: 0, facing: 1, active: false })
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)

    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const SPEED = 150 // world px / second

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    // Draw one parallax cactus layer given its world offset + styling.
    function cactusLayer(w, offset, spacing, baseY, u, bright, seed) {
      const first = Math.floor(offset / spacing) - 1
      const last = Math.floor((offset + w) / spacing) + 1
      for (let n = first; n <= last; n += 1) {
        const jitter = (hash(n + seed) - 0.5) * spacing * 0.5
        const x = n * spacing - offset + jitter
        const scale = u * (0.8 + hash(n * 2 + seed) * 0.5)
        drawCactus(ctx, x, baseY, scale, bright)
      }
    }

    let last = performance.now()

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w <= 0 || h <= 0) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }

      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      const moving = dir !== 0
      if (moving) {
        world.current.x += dir * SPEED * dt
        world.current.facing = dir
      }

      const u = Math.max(2, Math.round(Math.min(w / 300, h / 165)))
      const horizonY = h * 0.6
      const groundY = h * 0.72
      const t = now / 1000
      const step = reduced ? 0 : (Math.floor(t * 9) % 2 ? 1 : -1) * u
      const bob = reduced || !moving ? 0 : Math.abs(Math.sin(t * 9)) * u * 0.4
      const wx = world.current.x

      // --- sky ---
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY)
      sky.addColorStop(0, '#241a2e')
      sky.addColorStop(1, '#7a3350')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, horizonY)
      // sun
      ctx.fillStyle = '#ffb463'
      const sunR = Math.min(w, h) * 0.09
      ctx.beginPath()
      ctx.arc(w * 0.7, horizonY - sunR * 0.3, sunR, 0, Math.PI * 2)
      ctx.fill()

      // --- ground: intentionally transparent below the horizon so the black
      //     page shows through (no sand color); sky stays violet above. ---

      // --- far cacti (behind dino, dim, small, medium parallax) ---
      cactusLayer(w, wx * 0.55, u * 34, horizonY + h * 0.06, u * 0.7, false, 3.1)

      // --- dino (fixed on screen, world scrolls under it) ---
      drawDino(ctx, w * 0.42, groundY - bob, u, step, moving, world.current.facing)

      // --- near cacti (in front of dino, bright, big, fast parallax) ---
      cactusLayer(w, wx * 1.25, u * 46, h * 0.82, u * 1.25, true, 8.7)

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    // --- input ---
    function setKey(code, down) {
      if (code === 'ArrowLeft' || code === 'KeyA') { keys.current.left = down; return true }
      if (code === 'ArrowRight' || code === 'KeyD') { keys.current.right = down; return true }
      return false
    }
    function onKeyDown(e) {
      if (!world.current.active) return
      if (setKey(e.code, true)) e.preventDefault()
    }
    function onKeyUp(e) {
      setKey(e.code, false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const hold = (side, down) => (e) => {
    e.preventDefault()
    keys.current[side] = down
  }

  const btn = {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(0,0,0,0.35)',
    color: '#ffd7a8',
    fontSize: 20,
    lineHeight: '42px',
    textAlign: 'center',
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(2px)',
  }

  return (
    <div
      className="welcome-scene"
      onPointerEnter={() => { world.current.active = true }}
      onPointerLeave={() => {
        world.current.active = false
        keys.current.left = false
        keys.current.right = false
      }}
    >
      <canvas ref={canvasRef} className="welcome-scene__canvas" />
      <p
        className="welcome-scene__hint"
        aria-hidden="true"
        style={{
          position: 'absolute', left: 12, bottom: 10, margin: 0,
          font: '600 11px/1 var(--font-carbonot, monospace)',
          letterSpacing: '0.14em', color: 'rgba(255,215,168,0.75)',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)', pointerEvents: 'none',
        }}
      >
        ← → ANDAR
      </p>
      {touch ? (
        <div
          style={{
            position: 'absolute', right: 12, bottom: 10,
            display: 'flex', gap: 10, zIndex: 2,
          }}
        >
          <div
            role="button"
            aria-label="Andar para a esquerda"
            style={btn}
            onPointerDown={hold('left', true)}
            onPointerUp={hold('left', false)}
            onPointerLeave={hold('left', false)}
            onPointerCancel={hold('left', false)}
          >◀</div>
          <div
            role="button"
            aria-label="Andar para a direita"
            style={btn}
            onPointerDown={hold('right', true)}
            onPointerUp={hold('right', false)}
            onPointerLeave={hold('right', false)}
            onPointerCancel={hold('right', false)}
          >▶</div>
        </div>
      ) : null}
    </div>
  )
}

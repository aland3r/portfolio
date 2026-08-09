'use client'

import { useEffect, useRef, useState } from 'react'

/* Deterministic per-index hash so cactus fields tile the same every frame. */
function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/* Chunky pixel saguaro standing on (baseX, baseY). `f` = brightness factor. */
function drawCactus(ctx, baseX, baseY, u, bright) {
  // Saguaro as a single outline: black interior, white contour line only.
  const pts = [
    [-1, 0], [-1, 4], [-3, 4], [-3, 7], [-2, 7], [-2, 5], [-1, 5],
    [-1, 9], [1, 9], [1, 6], [2, 6], [2, 9], [3, 9], [3, 5], [1, 5], [1, 0],
  ]
  ctx.beginPath()
  for (let i = 0; i < pts.length; i += 1) {
    const x = baseX + pts[i][0] * u
    const y = baseY - pts[i][1] * u
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = '#000000'
  ctx.fill()
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1, u * 0.5)
  ctx.strokeStyle = bright ? '#ffffff' : 'rgba(255,255,255,0.5)'
  ctx.stroke()
}

/* Little pixel dinosaur, feet centered on (cx, groundY). `step` toggles legs. */
function drawDino(ctx, cx, groundY, u, step, moving, facing) {
  ctx.save()
  ctx.translate(cx, 0)
  if (facing < 0) ctx.scale(-1, 1)

  const swing = moving ? step : 0
  // Chrome-style T-Rex silhouette in white, facing right.
  // R(xLeft, yBottom, xRight, yTop) in `u` units, y measured up from the ground.
  const R = (xL, yB, xR, yT) =>
    ctx.fillRect(xL * u, groundY - yT * u, (xR - xL) * u, (yT - yB) * u)

  ctx.fillStyle = '#ffffff'
  // tail — steps up to the left
  R(-6, 6, -4, 9)
  R(-4, 5, -1, 8)
  // body
  R(-1, 3, 6, 8)
  // neck
  R(4, 8, 6, 10)
  // head
  R(5, 9, 11, 14)
  // snout / lower jaw
  R(11, 9, 13, 11)
  // little arm
  R(5.5, 5, 7.5, 6)
  // legs (animate only while moving)
  ctx.fillRect(0, groundY - u * 3, u * 1.6, u * 3 + swing)
  ctx.fillRect(u * 3, groundY - u * 3, u * 1.6, u * 3 - swing)

  // eye + mouth punched out in black
  ctx.fillStyle = '#000000'
  R(9, 11.9, 10.2, 13.2) // eye
  R(9.4, 9.5, 12.4, 10.3) // mouth

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

    // Arrow keys drive the dino whenever the hero is on screen. It only ever
    // captures Left/Right, so vertical page scrolling is unaffected.
    const io = new IntersectionObserver(
      (entries) => { world.current.active = entries[0]?.isIntersecting ?? false },
      { threshold: 0.35 },
    )
    io.observe(canvas)

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
      io.disconnect()
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
      onPointerLeave={() => {
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

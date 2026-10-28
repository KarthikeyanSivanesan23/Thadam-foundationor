import { useEffect, useRef } from 'react'

export type CursorRevealProps = {
  /** Image that is always visible. */
  baseImage: string
  /** Image revealed under the cursor brush. */
  revealImage: string
  /** Accessible description of the artwork. */
  alt: string
  /** Extra classes for the wrapper (sizing, rounding, height). */
  className?: string
  /** Brush radius as a fraction of min(width, height). Default .35 */
  brushSize?: number
  /** Mask fade per frame (0-1): lower leaves a longer trail. Default .06 */
  trailFade?: number
  /** Intrinsic pixel width, used to reserve layout space before paint. */
  width?: number
  /** Intrinsic pixel height, used to reserve layout space before paint. */
  height?: number
  /** Zoom factor for the reveal artwork; draws it larger than the base layer. Default 1. */
  revealScale?: number
  /** Extra pixels (CSS px) added to the drawn reveal size, kept centered. Default 0. */
  revealExpand?: number
  /** Extra pixels (CSS px) added to the reveal height only, overriding `revealExpand` for height. Default `revealExpand`. */
  revealExpandY?: number
  /** Horizontal pixel offset applied when drawing the reveal artwork. Default 0. */
  revealOffsetX?: number
  /** Vertical image focus: 0 = top-aligned, .5 = centered, 1 = bottom-aligned. Default .5 */
  focusY?: number
  /** How the artwork fills the frame. `cover` crops, `contain` letterboxes, `fill` stretches. Default cover. */
  fit?: 'cover' | 'contain' | 'fill'
}

const MAX_DPR = 2
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function CursorReveal({
  baseImage,
  revealImage,
  alt,
  className,
  brushSize = .35,
  trailFade = .06,
  width,
  height,
  revealScale = 1,
  revealExpand = 0,
  revealExpandY = revealExpand,
  revealOffsetX = 0,
  focusY = .5,
  fit = 'cover',
}: CursorRevealProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const revealRef = useRef<HTMLCanvasElement>(null)
  const reserveRatio = !(width && height)

  useEffect(() => {
    const host = hostRef.current
    const baseCanvas = baseRef.current
    const revealCanvas = revealRef.current
    if (!host || !baseCanvas || !revealCanvas) return

    const baseCtx = baseCanvas.getContext('2d')
    const revealCtx = revealCanvas.getContext('2d')
    const mask = document.createElement('canvas')
    const maskCtx = mask.getContext('2d')
    if (!baseCtx || !revealCtx || !maskCtx) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const baseImg = new Image()
    const revealImg = new Image()

    let disposed = false
    let ready = false
    let raf = 0
    let dpr = 1
    let w = 0
    let h = 0
    let active = false
    let hasLast = false
    let px = 0
    let py = 0
    let lx = 0
    let ly = 0
    let ex = 0
    let ey = 0
    let lastFrame = 0
    let fading = false
    let closeOpen = 1

    const FADE_EPSILON = 1 / 255

    // Per-frame trail persistence while hovering (lower = longer trail). Reduced
    // motion disables the trail: the mask is refilled opaque every frame, and the
    // fade-out on leave is instant.
    // Close speed once the pointer leaves: a constant, time-scaled per-frame step
    // so the erase washes back at one even pace (no sticky start, no long tail)
    // and the mask always finishes fully opaque.
    const fadeCloseRate = () => motion.matches ? 1 : clamp(trailFade * 6, .35, 1)

    // Fit against the natural size. `cover` crops to fill the frame; `contain`
    // keeps the whole image visible inside it; `fill` stretches to the frame.
    // `factor` scales the destination box, so the artwork is painted larger
    // for callers that want a zoomed layer, e.g. the reveal.
    const drawImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, factor = 1, offsetX = 0, expandX = 0, expandY = 0) => {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      if (!iw || !ih || !w || !h) return
      // Keep the artwork centered on the canvas (same position/place as the
      // base layer) and scale it by `factor` around that center, so a zoomed
      // reveal layer stays aligned with the base instead of drifting.
      // `expandX`/`expandY` additionally enlarge the drawn box by whole pixels.
      const baseScale = fit === 'contain' ? Math.min(w / iw, h / ih)
        : fit === 'fill' ? null
        : Math.max(w / iw, h / ih)
      const dw = baseScale === null ? w * factor + expandX : iw * (baseScale * factor) + expandX
      const dh = baseScale === null ? h * factor + expandY : ih * (baseScale * factor) + expandY
      const x = (w - dw) / 2 - offsetX
      const y = fit === 'contain' || fit === 'fill' ? (h - dh) / 2 : (h - dh) * clamp(focusY, 0, 1)
      ctx.drawImage(img, x, y, dw, dh)
    }

    const drawBase = () => {
      if (!w || !h) return
      baseCtx.setTransform(1, 0, 0, 1, 0, 0)
      baseCtx.clearRect(0, 0, w, h)
      drawImage(baseCtx, baseImg)
    }

    const blob = (x: number, y: number) => {
      const radius = Math.max(1, brushSize * Math.min(w, h))
      const gradient = maskCtx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(.35, 'rgba(255,255,255,.92)')
      gradient.addColorStop(.65, 'rgba(255,255,255,.5)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      maskCtx.fillStyle = gradient
      maskCtx.beginPath()
      maskCtx.arc(x, y, radius, 0, Math.PI * 2)
      maskCtx.fill()
    }

    // Stamp the brush along the segment travelled since the last frame so fast
    // pointer moves leave a continuous ribbon instead of separate dots. The pen
    // position eases toward the raw pointer each frame, so abrupt hand reversals
    // glide rather than snapping between segments.
    const stamp = () => {
      if (!hasLast) return
      ex += (px - ex) * .45
      ey += (py - ey) * .45
      const radius = Math.max(1, brushSize * Math.min(w, h))
      const dx = ex - lx
      const dy = ey - ly
      const distance = Math.hypot(dx, dy)
      const step = radius * .12
      maskCtx.globalCompositeOperation = 'destination-out'
      if (distance <= step) {
        blob(ex, ey)
      } else {
        const count = Math.min(64, Math.ceil(distance / step))
        for (let i = 1; i <= count; i++) blob(lx + (dx * i) / count, ly + (dy * i) / count)
      }
      lx = ex
      ly = ey
    }

    const draw = (dtMs: number) => {
      if (!ready || !w || !h) return
      let fillAlpha: number
      if (active) {
        fading = false
        fillAlpha = motion.matches ? 1 : clamp(trailFade, .01, 1)
      } else if (fading) {
        const rate = 1 - Math.pow(1 - fadeCloseRate(), Math.max(1, dtMs) / (1000 / 60))
        fillAlpha = rate
        closeOpen *= 1 - rate
        if (closeOpen <= FADE_EPSILON) {
          fillAlpha = 1
          fading = false
          lastFrame = 0
        }
      } else {
        fillAlpha = 1
      }
      maskCtx.globalCompositeOperation = 'source-over'
      maskCtx.fillStyle = `rgba(0,0,0,${fillAlpha})`
      maskCtx.fillRect(0, 0, w, h)
      if (active) stamp()

      revealCtx.globalCompositeOperation = 'source-over'
      revealCtx.clearRect(0, 0, w, h)
      drawImage(revealCtx, revealImg, revealScale, revealOffsetX, revealExpand * dpr, revealExpandY * dpr)
      revealCtx.globalCompositeOperation = 'destination-out'
      revealCtx.drawImage(mask, 0, 0)
      revealCtx.globalCompositeOperation = 'source-over'
    }

    const frame = (now: number) => {
      raf = 0
      const dtMs = lastFrame ? Math.min(100, now - lastFrame) : 16.7
      lastFrame = now
      draw(dtMs)
      if (active) {
        raf = requestAnimationFrame(frame)
      } else if (fading && closeOpen > FADE_EPSILON) {
        raf = requestAnimationFrame(frame)
      }
    }

    const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }

    const resize = () => {
      const box = host.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      w = Math.round(box.width * dpr)
      h = Math.round(box.height * dpr)
      for (const canvas of [baseCanvas, revealCanvas, mask]) {
        canvas.width = w
        canvas.height = h
      }
      maskCtx.globalCompositeOperation = 'source-over'
      maskCtx.fillStyle = '#000'
      maskCtx.fillRect(0, 0, w, h)
      revealCtx.globalCompositeOperation = 'source-over'
      revealCtx.clearRect(0, 0, w, h)
      if (baseImg.naturalWidth) drawBase()
    }

    const onPointerDown = (event: PointerEvent) => {
      const box = host.getBoundingClientRect()
      px = (event.clientX - box.left) * dpr
      py = (event.clientY - box.top) * dpr
      lx = px
      ly = py
      ex = px
      ey = py
      hasLast = true
      active = true
      kick()
    }

    const onPointerMove = (event: PointerEvent) => {
      const box = host.getBoundingClientRect()
      px = (event.clientX - box.left) * dpr
      py = (event.clientY - box.top) * dpr
      if (!hasLast) {
        lx = px
        ly = py
        ex = px
        ey = py
        hasLast = true
      }
      active = true
      kick()
    }

    // Touch pointers don't fire a reliable pointerleave; finish the gesture so
    // the trail fades out and the frame loop stops.
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      onPointerLeave()
    }

    const onPointerLeave = () => {
      if (!active) return
      active = false
      hasLast = false
      fading = true
      closeOpen = 1
      kick()
    }

    const onWindowResize = () => {
      resize()
      kick()
    }

    const onImageReady = () => {
      if (disposed) return
      if (!w || !h) resize()
      if (baseImg.naturalWidth) drawBase()
      if (baseImg.naturalWidth && revealImg.naturalWidth) {
        ready = true
        if (reserveRatio && baseImg.naturalWidth && baseImg.naturalHeight) {
          host.style.aspectRatio = `${baseImg.naturalWidth} / ${baseImg.naturalHeight}`
        }
        draw(16.7)
        kick()
      }
    }

    const observer = new ResizeObserver(() => {
      if (disposed) return
      resize()
      kick()
    })

    resize()
    baseImg.onload = onImageReady
    revealImg.onload = onImageReady
    baseImg.src = baseImage
    revealImg.src = revealImage

    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('pointermove', onPointerMove, { passive: true })
    host.addEventListener('pointerup', onPointerUp)
    host.addEventListener('pointerleave', onPointerLeave)
    host.addEventListener('pointercancel', onPointerLeave)
    window.addEventListener('resize', onWindowResize)
    observer.observe(host)

    return () => {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      observer.disconnect()
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerup', onPointerUp)
      host.removeEventListener('pointerleave', onPointerLeave)
      host.removeEventListener('pointercancel', onPointerLeave)
      window.removeEventListener('resize', onWindowResize)
      baseImg.onload = null
      revealImg.onload = null
    }
  }, [baseImage, revealImage, brushSize, trailFade, reserveRatio, revealScale, revealExpand, revealExpandY, revealOffsetX, focusY, fit])

  return (
    <div
      ref={hostRef}
      className={className ? `cursor-reveal ${className}` : 'cursor-reveal'}
      role="img"
      aria-label={alt}
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      <canvas ref={baseRef} className="cursor-reveal__layer" aria-hidden="true" />
      <canvas ref={revealRef} className="cursor-reveal__layer" aria-hidden="true" />
    </div>
  )
}

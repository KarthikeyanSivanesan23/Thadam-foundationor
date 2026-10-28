/**
 * About-section background: the existing "Futuristic Neon Sports Wave
 * Background" image with flowing neon light pulses traced along its wave
 * shapes.
 *
 * Alignment trick: the SVG uses the image's intrinsic viewBox
 * (1679x937) with preserveAspectRatio="xMidYMid slice", which crops
 * identically to background-size: cover / background-position: center —
 * so the paths stay glued to the waves at every viewport size.
 *
 * Motion: pure CSS stroke-dashoffset animations on pathLength-normalized
 * strokes (no rAF, no React state). An IntersectionObserver pauses the
 * animations while the section is offscreen by toggling a class on the
 * <svg> node directly (no re-renders).
 */
import { useEffect, useRef } from 'react'

type Wave = {
  d: string
  /** Gradient stroke colors, start -> end. */
  colors: [string, string]
  /** Gradient axis in userSpace coordinates. */
  axis: [number, number, number, number]
  /** Faint static trail color, reinforcing the curve. */
  trail: string
  width: number
  dur: number
  delay: number
  reverse?: boolean
  shimmer?: boolean
}

const WAVES: Wave[] = [
  // Top-left violet arc sweeping over the stadium truss.
  { d: 'M -30 225 C 200 95 430 40 660 55 C 850 68 950 180 1035 315', colors: ['#a78bfa', '#7c3aed'], axis: [-30, 225, 1035, 315], trail: '#8b5cf6', width: 3.5, dur: 14, delay: -2, shimmer: true },
  // Its cyan twin strand, offset below.
  { d: 'M -30 262 C 210 142 440 88 660 97 C 842 110 942 218 1028 342', colors: ['#22d3ee', '#818cf8'], axis: [-30, 262, 1028, 342], trail: '#22d3ee', width: 3, dur: 17, delay: -9 },
  // Top-center violet crest dipping under the basketball player.
  { d: 'M 690 70 C 900 78 1075 140 1190 245 C 1215 268 1235 295 1250 320', colors: ['#e879f9', '#7c3aed'], axis: [690, 70, 1250, 320], trail: '#c084fc', width: 3, dur: 12, delay: -5, reverse: true },
  // Right-side cyan band sliding down from the top-right corner.
  { d: 'M 1710 55 C 1470 85 1290 180 1160 320 C 1090 396 1050 460 1020 520', colors: ['#67e8f9', '#22d3ee'], axis: [1710, 55, 1020, 520], trail: '#22d3ee', width: 3.5, dur: 13, delay: -7, shimmer: true },
  // The main S-braid: bottom-left rise, apex at center, fan-out right.
  { d: 'M -25 880 C 230 775 450 615 660 500 C 790 430 880 480 960 585 C 1050 706 1150 790 1300 830 C 1440 862 1580 870 1710 880', colors: ['#22d3ee', '#8b5cf6'], axis: [-25, 880, 1710, 880], trail: '#22d3ee', width: 4, dur: 16, delay: -3, shimmer: true },
  // Bottom-left violet sweep under the sprinter.
  { d: 'M -25 715 C 130 790 230 880 295 960', colors: ['#a78bfa', '#e879f9'], axis: [-25, 715, 295, 960], trail: '#a855f7', width: 3, dur: 11, delay: -6 },
  // Bottom-right cyan field edge.
  { d: 'M 600 910 C 880 805 1120 762 1380 768 C 1520 772 1620 780 1710 790', colors: ['#22d3ee', '#67e8f9'], axis: [600, 910, 1710, 790], trail: '#22d3ee', width: 3.5, dur: 15, delay: -11 },
]

const IMAGE_URL = '/images/Futuristic%20Neon%20Sports%20Wave%20Background.png'

export function NeonWaveBackground() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    // Pause while offscreen; toggling a class on the node avoids re-renders.
    const observer = new IntersectionObserver(([entry]) => {
      svg.classList.toggle('is-offscreen', !entry.isIntersecting)
    }, { rootMargin: '80px' })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="neon-wave-bg" aria-hidden="true" style={{ backgroundImage: `url("${IMAGE_URL}")` }}>
      <svg ref={svgRef} className="neon-wave-svg" viewBox="0 0 1679 937" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="neon-wave-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {WAVES.map((wave, i) => (
            <linearGradient key={i} id={`neon-wave-grad-${i}`} gradientUnits="userSpaceOnUse" x1={wave.axis[0]} y1={wave.axis[1]} x2={wave.axis[2]} y2={wave.axis[3]}>
              <stop offset="0" stopColor={wave.colors[0]} stopOpacity="0" />
              <stop offset=".25" stopColor={wave.colors[0]} />
              <stop offset=".75" stopColor={wave.colors[1]} />
              <stop offset="1" stopColor={wave.colors[1]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        <g className="neon-wave-trails">
          {WAVES.map((wave, i) => (
            <path key={i} d={wave.d} fill="none" stroke={wave.trail} strokeWidth={wave.width * .6} strokeLinecap="round" opacity=".1" />
          ))}
        </g>
        <g className="neon-wave-pulses" filter="url(#neon-wave-glow)">
          {WAVES.map((wave, i) => (
            <g key={i}>
              <path
                className="neon-wave-pulse"
                d={wave.d}
                fill="none"
                stroke={`url(#neon-wave-grad-${i})`}
                strokeWidth={wave.width}
                strokeLinecap="round"
                pathLength={100}
                style={{ strokeDasharray: '14 86', animation: `neon-wave-flow ${wave.dur}s linear ${wave.delay}s infinite ${wave.reverse ? 'reverse' : 'normal'}` }}
              />
              {wave.shimmer && (
                <path
                  className="neon-wave-pulse neon-wave-shimmer"
                  d={wave.d}
                  fill="none"
                  stroke={`url(#neon-wave-grad-${i})`}
                  strokeWidth={wave.width * .55}
                  strokeLinecap="round"
                  pathLength={100}
                  style={{ strokeDasharray: '3 22', animation: `neon-wave-flow ${wave.dur * 2.1}s linear ${wave.delay * 1.7}s infinite ${wave.reverse ? 'normal' : 'reverse'}` }}
                />
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

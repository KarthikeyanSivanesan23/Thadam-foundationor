import { lazy, Suspense } from 'react'
import { CursorReveal } from '../ui/CursorReveal'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { CoreFallback } from '../three/CoreFallback'
import PerspectiveTunnelHero from '../ui/perspective-tunnel-hero'
import '../../styles/cursor-reveal.css'

const DeveloperCore = lazy(() => import('../three/DeveloperCore'))

interface HeroRevealProps {
  baseImage?: string
  overlayImage?: string
}

export function HeroReveal({
  baseImage = '/images/T1.png',
  overlayImage = '/images/T2.png',
}: HeroRevealProps) {
  return (
    <section id="home" className="hero-reveal-section" aria-labelledby="hero-title">
      <PerspectiveTunnelHero overlay />
      <div className="hero-reveal-media">
        <CursorReveal
          baseImage={baseImage}
          revealImage={overlayImage}
          alt="Three Thadam Foundation students in football and school uniforms"
          className="hero-reveal-reveal"
          brushSize={0.28}
          trailFade={0.05}
          focusY={0}
          fit="fill"
          revealExpand={8}
          revealExpandY={7}
          revealScale={1.01}
        />
      </div>
      <div className="hero-reveal-core" aria-hidden="true">
        <ErrorBoundary fallback={<CoreFallback />}>
          <Suspense fallback={<CoreFallback />}>
            <DeveloperCore />
          </Suspense>
        </ErrorBoundary>
      </div>
      <a className="hero-reveal-scroll" href="#about" aria-label="Scroll to explore">
        <span className="hero-reveal-scroll-line" aria-hidden="true" />
      </a>
    </section>
  )
}

export default HeroReveal

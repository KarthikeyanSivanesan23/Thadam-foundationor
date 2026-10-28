import { useState } from 'react'
import { ArrowDown, ArrowUpRight, Braces, Cloud, Cpu, Database, Layers, Workflow } from 'lucide-react'
import { Reveal } from '../ui/Reveal'

const systems = [
  { name: 'Frontend', detail: 'Interfaces that feel as good as they function.', stack: 'REACT / TYPESCRIPT', icon: Layers },
  { name: 'API', detail: 'Clear contracts. Reliable communication.', stack: 'REST / AUTHENTICATION', icon: Workflow },
  { name: 'Backend', detail: 'The quiet engineering behind every interaction.', stack: 'DJANGO / NODE.JS', icon: Braces },
  { name: 'Database', detail: 'Structure, integrity and room to grow.', stack: 'POSTGRESQL / MONGODB', icon: Database },
  { name: 'AI', detail: 'Intelligence with intention, grounded in context.', stack: 'LLM / RAG / AGENTS', icon: Cpu },
  { name: 'Deployment', detail: 'From an idea on localhost to a useful product.', stack: 'CLOUD / CI / DELIVERY', icon: Cloud },
]

export function About() {
  const [active, setActive] = useState(2)
  const current = systems[active]
  return <section id="about" className="section about-section about-section--sporty container">
    <div className="about-sport-bg" aria-hidden="true">
      <div className="about-sport-bg__image" />
      <svg className="about-sport-bg__waves" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="about-neon-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="25%" stopColor="#22d3ee" stopOpacity=".9" />
            <stop offset="55%" stopColor="#a5f3fc" stopOpacity="1" />
            <stop offset="80%" stopColor="#22d3ee" stopOpacity=".8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="about-neon-violet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="22%" stopColor="#a855f7" stopOpacity=".8" />
            <stop offset="52%" stopColor="#d8b4fe" stopOpacity="1" />
            <stop offset="82%" stopColor="#a855f7" stopOpacity=".7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="about-neon-magenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0" />
            <stop offset="28%" stopColor="#9333ea" stopOpacity=".7" />
            <stop offset="58%" stopColor="#c084fc" stopOpacity=".95" />
            <stop offset="88%" stopColor="#9333ea" stopOpacity=".6" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
          </linearGradient>
          <filter id="about-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path className="about-sport-wave about-sport-wave--cyan" filter="url(#about-neon-glow)" stroke="url(#about-neon-cyan)" d="M -120 820 C 260 720, 620 660, 980 700 C 1280 740, 1540 820, 2040 880" />
        <path className="about-sport-wave about-sport-wave--violet" filter="url(#about-neon-glow)" stroke="url(#about-neon-violet)" d="M -80 620 C 320 540, 700 500, 1040 560 C 1360 620, 1620 720, 2000 760" />
        <path className="about-sport-wave about-sport-wave--cyan-slow" filter="url(#about-neon-glow)" stroke="url(#about-neon-cyan)" d="M -160 920 C 200 860, 580 820, 920 840 C 1260 860, 1560 920, 2020 980" />
        <path className="about-sport-wave about-sport-wave--violet-slow" filter="url(#about-neon-glow)" stroke="url(#about-neon-violet)" d="M -40 520 C 340 460, 760 420, 1100 480 C 1420 540, 1680 640, 1980 680" />
        <path className="about-sport-wave about-sport-wave--magenta" filter="url(#about-neon-glow)" stroke="url(#about-neon-magenta)" d="M -140 720 C 280 640, 660 580, 1020 640 C 1380 700, 1660 800, 2060 840" />
        <path className="about-sport-wave about-sport-wave--violet-deep" filter="url(#about-neon-glow)" stroke="url(#about-neon-violet)" d="M -100 860 C 240 780, 600 740, 940 780 C 1300 820, 1600 900, 2040 940" />
        <path className="about-sport-wave about-sport-wave--cyan-deep" filter="url(#about-neon-glow)" stroke="url(#about-neon-cyan)" d="M -60 580 C 360 500, 780 460, 1120 520 C 1460 580, 1740 680, 2020 720" />
      </svg>
    </div>
    <div className="about-sport-content">
      <Reveal className="about-copy"><p className="eyebrow section-label"><span />01 / ABOUT</p><h2>ENGINEERING<br />BEYOND THE<br /><em>ORDINARY.</em></h2><p className="about-lead">A developer’s logic.<br />A creator’s curiosity.</p><p>I’m Karthikeyan — a full-stack developer and AI application builder based in India. I connect thoughtful interfaces with capable systems to turn complex ideas into intuitive digital products.</p><p>From the first component to the final deployment, I care about the details that make software genuinely useful. And the unexpected ones that make it memorable.</p><a className="text-link" href="#contact">Let’s build something considered <ArrowUpRight /></a></Reveal>
      <Reveal className="system-diagram" delay={.12}><div className="diagram-header"><span className="eyebrow">THE CONNECTED STACK</span><span className="eyebrow text-muted">06 LAYERS / ONE VISION</span></div><div className="system-flow">{systems.map(({ name, stack, icon: Icon }, index) => <div className="system-node-wrap" key={name}><button className={`system-node ${active === index ? 'is-active' : ''}`} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} aria-pressed={active === index}><span className="system-node-icon"><Icon size={18} strokeWidth={1.3} /></span><span className="system-node-name">{name}<small className="eyebrow">{stack}</small></span><span className="system-node-number">0{index + 1}</span></button>{index < systems.length - 1 && <div className="system-connector"><ArrowDown size={11} /><span /></div>}</div>)}</div><div className="system-caption" aria-live="polite"><span className="status-dot" /><p>{current.detail}</p></div></Reveal>
    </div>
  </section>
}

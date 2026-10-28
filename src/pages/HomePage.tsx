import { SEO } from '../components/common/SEO'
import { HeroReveal } from '../components/sections/HeroReveal'
import { About } from '../components/sections/About'
import { BehindCode } from '../components/sections/BehindCode'
import { CommandCenter } from '../components/sections/CommandCenter'
import { SkillsUniverse } from '../components/sections/SkillsUniverse'
import { Projects } from '../components/sections/Projects'
import { StorePreview } from '../components/sections/StorePreview'
import { Services } from '../components/sections/Services'
import { Contact } from '../components/sections/Contact'

export default function HomePage() {
  return <><SEO title="Full Stack & AI Developer" description="Karthikeyan S builds intelligent full-stack applications, AI-powered systems and immersive 3D web experiences. Explore the engineering lab." /><HeroReveal baseImage="/images/T1.png" overlayImage="/images/T2.png" /><About /><BehindCode /><CommandCenter /><SkillsUniverse /><Projects /><StorePreview /><Services /><Contact /></>
}

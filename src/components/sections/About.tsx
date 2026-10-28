import { ScrollExpandMedia } from '../ui/scroll-expansion-hero'

const mediaContent = {
  src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  background:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  title: "Thadam Foundation",
  date: "Engineering Beyond Ordinary",
  scrollToExpand: "Scroll to Expand",
}

export function About() {
  return (
    <section id="about">
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc={mediaContent.src}
        bgImageSrc={mediaContent.background}
        title={mediaContent.title}
        date={mediaContent.date}
        scrollToExpand={mediaContent.scrollToExpand}
        textBlend
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Engineering Beyond the Ordinary
          </h2>
          <p className="text-lg mb-6 text-white/80 leading-relaxed">
            A developer&apos;s logic. A creator&apos;s curiosity.
          </p>
          <p className="text-lg mb-6 text-white/80 leading-relaxed">
            I&apos;m Karthikeyan — a full-stack developer and AI application builder based in India. I connect thoughtful interfaces with capable systems to turn complex ideas into intuitive digital products.
          </p>
          <p className="text-lg text-white/80 leading-relaxed">
            From the first component to the final deployment, I care about the details that make software genuinely useful. And the unexpected ones that make it memorable.
          </p>
        </div>
      </ScrollExpandMedia>
    </section>
  )
}

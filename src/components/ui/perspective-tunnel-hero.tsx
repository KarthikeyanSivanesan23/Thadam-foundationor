import {
    motion,
    useTransform,
    useMotionValue,
    useSpring,
    useScroll,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// Raw motion value controlled directly by mouse wheel / touch trackpad
// (standalone mode); overlay mode scrubs from the host section's scroll.
const SPRING_CONFIG = {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0001,
};

export interface PerspectiveTunnelHeroProps {
    /**
     * Overlay mode: renders as an absolutely positioned layer inside a
     * `relative overflow-hidden` host (e.g. a hero section) instead of a
     * standalone 100svh block. Native page scrolling is preserved and the
     * tunnel progress is scrubbed from the host section's scroll position.
     */
    overlay?: boolean;
}

export default function PerspectiveTunnelHero({ overlay = false }: PerspectiveTunnelHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // The rightward nudge (x: 36) is a desktop composition choice; keep the
    // title dead-center on mobile.
    const wide = useMediaQuery("(min-width: 768px)");

    // Scroll-driven progress for overlay mode: 0 while the host is pinned
    // at the top of the viewport, 1 as the host scrolls out of view.
    const { scrollYProgress: pageProgress } = useScroll({
        target: containerRef,
        offset: overlay ? ["start start", "end start"] : ["start end", "end start"],
    });

    // Wheel-driven progress for standalone (fullscreen) mode.
    const wheelProgress = useMotionValue(0);
    const rawProgress = overlay ? pageProgress : wheelProgress;
    const smoothProgress = useSpring(rawProgress, SPRING_CONFIG);

    // Standalone mode only: the wheel is captured locally inside the 100vh
    // viewport container without page scroll; overlay mode keeps native
    // scrolling untouched.
    useEffect(() => {
        if (overlay) return;
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const current = wheelProgress.get();
            const delta = e.deltaY * 0.0008; // Adjust speed of tunnel travel here
            const next = Math.min(1, Math.max(0, current + delta));
            wheelProgress.set(next);
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [overlay, wheelProgress]);

    const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1, 1.35]);
    const titleOpacity = useTransform(smoothProgress, [0, 0.12, 0.85, 1], [0.25, 1, 1, 0]);

    return (
        <div
            ref={containerRef}
            className={`flex items-center justify-center overflow-hidden select-none ${
                overlay
                    ? "absolute inset-0 z-[2] pointer-events-none"
                    : "relative h-[100svh] w-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white"
            }`}
            style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
            }}
        >
            {/* Immersive Background Grid & Glow */}
            <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] ${overlay ? "opacity-90" : "opacity-70"} dark:opacity-65`} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2)_0%,transparent_75%)]" />

            {/* Depth Ring Guides */}
            <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-indigo-500/15 dark:border-indigo-400/10" />
            <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-neutral-300/60 dark:border-white/10" />

            {/* Central Anchor Typography — overlay mode pins it to the host header zone */}
            <motion.div
                style={{ scale: titleScale, opacity: titleOpacity, x: wide ? 36 : 0 }}
                className={`pointer-events-none z-0 flex flex-col items-center text-center px-6 max-w-3xl ${overlay ? "absolute inset-x-0 top-[84px] mx-auto sm:top-[100px]" : ""}`}
            >
                <h1 id="hero-title" className="text-[64px] sm:text-7xl md:text-[104px] lg:text-[112px] xl:text-[120px] font-bold tracking-tighter leading-[0.85] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-600 dark:from-white dark:via-white dark:to-white/40 bg-clip-text text-transparent">
                    THADAM
                    <br />
                    FOUNDATION
                </h1>
                <p className="mt-3 sm:mt-4 max-w-[36ch] text-xs sm:text-base font-light text-neutral-600 dark:text-neutral-400">
                    Place your footprint wherever you go.
                </p>
            </motion.div>
        </div>
    );
}

"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

import { useHydrated } from "@/lib/use-hydrated";

const ease = [0.22, 1, 0.36, 1] as const;

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Reserve space before the section enters the viewport (charts only mount when visible). */
  placeholderClassName?: string;
};

/**
 * Fade + gentle lift when scrolled into view. Children mount only once `inView` so Chart.js
 * draw animations align with the reveal.
 */
export function ScrollReveal({ children, className, placeholderClassName = "min-h-[220px]" }: ScrollRevealProps) {
  const hydrated = useHydrated();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px", amount: 0.12 });
  const showContent = hydrated && inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.62, ease }}
    >
      {showContent ? children : <div className={placeholderClassName} aria-hidden />}
    </motion.div>
  );
}

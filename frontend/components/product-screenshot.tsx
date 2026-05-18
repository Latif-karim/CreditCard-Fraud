"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_SRC =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80";

const CUSTOM_SRC = "/screenshots/dashboard-preview.png";

type ProductScreenshotProps = {
  className?: string;
  alt?: string;
};

export function ProductScreenshot({
  className = "",
  alt = "FraudShield operations dashboard",
}: ProductScreenshotProps) {
  const [useCustom, setUseCustom] = useState(true);
  const [customLoaded, setCustomLoaded] = useState(false);

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-800/80 shadow-2xl ${className}`}
    >
      {useCustom ? (
        <Image
          src={CUSTOM_SRC}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${customLoaded ? "opacity-95" : "opacity-0"}`}
          sizes="(max-width: 1024px) 100vw, 600px"
          priority
          onLoad={() => setCustomLoaded(true)}
          onError={() => setUseCustom(false)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={FALLBACK_SRC} alt={alt} className="h-full w-full object-cover opacity-90" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { resolveImageUrlsForDisplay } from "@/lib/imageUrl";

export function SmartImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const candidates = resolveImageUrlsForDisplay(src);
  const [index, setIndex] = useState(0);
  const current = candidates[index];

  if (!current) {
    return (
      <div
        className={`flex items-center justify-center bg-black/5 text-xs text-muted ${className || ""}`}
      >
        No image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (index < candidates.length - 1) setIndex((i) => i + 1);
      }}
    />
  );
}

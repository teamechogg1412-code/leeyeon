"use client";

import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import type { StardomEditorial } from "@/lib/stardom";

type Props = {
  editorials: StardomEditorial[];
};

export function EditorialGallery({ editorials }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const active = editorials.find((ed) => ed.id === activeId) ?? null;
  const media = active?.editorial_media ?? [];
  const current = media[index];

  const close = useCallback(() => {
    setActiveId(null);
    setIndex(0);
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (media.length ? (i - 1 + media.length) % media.length : 0));
  }, [media.length]);

  const next = useCallback(() => {
    setIndex((i) => (media.length ? (i + 1) % media.length : 0));
  }, [media.length]);

  useEffect(() => {
    if (!activeId) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeId, close, prev, next]);

  function open(id: string) {
    setActiveId(id);
    setIndex(0);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {editorials.map((ed) => {
          const cover = ed.editorial_media[0];
          const count = ed.editorial_media.length;
          if (!cover) return null;
          return (
            <button
              key={ed.id}
              type="button"
              onClick={() => open(ed.id)}
              className="group text-left"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#1a1a1a]">
                <SmartImage
                  src={cover.media_url}
                  alt={ed.media_name || "editorial"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  {ed.year_label && (
                    <p className="text-[10px] tracking-wide text-white/70">
                      {ed.year_label}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-[13px] font-medium text-white">
                    {ed.media_name || "Editorial"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/65">
                    사진 {count}장
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {active && current && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={active.media_name || "화보"}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="닫기"
          >
            <X size={20} />
          </button>

          <div
            className="relative flex w-full max-w-4xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-center text-white">
              {active.year_label && (
                <p className="text-xs tracking-wide text-white/60">
                  {active.year_label}
                </p>
              )}
              <p className="text-sm font-medium">
                {active.media_name || "Editorial"}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {index + 1} / {media.length}
              </p>
            </div>

            <div className="relative flex w-full items-center justify-center">
              {media.length > 1 && (
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-0 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:-left-12"
                  aria-label="이전"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <div className="max-h-[75vh] w-full overflow-hidden rounded-xl">
                <SmartImage
                  src={current.media_url}
                  alt={active.media_name || "editorial"}
                  className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>

              {media.length > 1 && (
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-0 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:-right-12"
                  aria-label="다음"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {media.length > 1 && (
              <div className="mt-4 flex max-w-full gap-1.5 overflow-x-auto px-1">
                {media.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-2 w-2 shrink-0 rounded-full transition ${
                      i === index ? "bg-white" : "bg-white/35 hover:bg-white/55"
                    }`}
                    aria-label={`${i + 1}번째 사진`}
                    aria-current={i === index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

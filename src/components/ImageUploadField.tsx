"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploadField({
  name = "image",
  label = "이미지",
  hint = "JPG · PNG · WEBP · GIF / 5MB 이하",
  compact = false,
}: {
  name?: string;
  label?: string;
  hint?: string;
  compact?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function applyFile(file: File | null) {
    setError(null);
    if (!file) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);

    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    applyFile(e.target.files?.[0] || null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files?.[0] || null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {fileName && (
          <button
            type="button"
            onClick={() => applyFile(null)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-black"
          >
            <X size={12} /> 제거
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={onInputChange}
      />

      {preview ? (
        <div
          className={`relative overflow-hidden rounded-2xl border border-line bg-[#f3f3f3] ${
            compact ? "aspect-[4/3]" : "aspect-[16/10]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-full w-full object-cover"
          />
          <label
            htmlFor={inputId}
            className="absolute inset-x-3 bottom-3 inline-flex cursor-pointer justify-center rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
          >
            이미지 바꾸기
          </label>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition ${
            compact ? "min-h-[120px]" : "min-h-[160px]"
          } ${
            dragging
              ? "border-black bg-black/[0.03]"
              : "border-line bg-[#fafafa] hover:border-black/25 hover:bg-black/[0.02]"
          }`}
        >
          <ImagePlus size={compact ? 18 : 22} className="text-black/45" />
          <p className="mt-2 text-sm font-medium">클릭하거나 이미지를 끌어다 놓기</p>
          <p className="mt-1 text-[11px] text-muted">{hint}</p>
        </label>
      )}

      {error && <p className="text-xs text-[#c81e1e]">{error}</p>}
      {fileName && !error && (
        <p className="truncate text-[11px] text-muted">{fileName}</p>
      )}
    </div>
  );
}

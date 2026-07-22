"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Film, X } from "lucide-react";
import { upload } from "@vercel/blob/client";

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = "video/mp4,video/webm,video/quicktime";

export function VideoUploadField({
  name = "video",
  uploadedUrlName = "videoUploadedUrl",
  label = "영상 파일",
  hint = "MP4 · WEBM · MOV / 100MB 이하",
}: {
  name?: string;
  uploadedUrlName?: string;
  label?: string;
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [serverFallback, setServerFallback] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function clearPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  function reset() {
    clearPreview();
    setFileName(null);
    setUploadedUrl(null);
    setServerFallback(false);
    setUploading(false);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function applyFile(file: File | null) {
    setError(null);
    if (!file) {
      reset();
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError("영상 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("파일 크기는 100MB 이하여야 합니다.");
      return;
    }

    clearPreview();
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setFileName(file.name);
    setUploadedUrl(null);
    setServerFallback(false);
    setProgress(0);

    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const blob = await upload(`videos/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/video-upload",
        multipart: true,
        onUploadProgress: (event) => {
          setProgress(Math.round(event.percentage));
        },
      });
      setUploadedUrl(blob.url);
      setServerFallback(false);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      // No Blob token / local dev: keep file for server-action upload.
      setServerFallback(true);
      setUploadedUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    void applyFile(e.target.files?.[0] || null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    void applyFile(e.dataTransfer.files?.[0] || null);
  }

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onSubmit = (event: Event) => {
      if (uploading) {
        event.preventDefault();
        setError("영상 업로드가 끝날 때까지 기다려 주세요.");
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [uploading]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {(fileName || uploadedUrl) && !uploading && (
          <button
            type="button"
            onClick={() => void applyFile(null)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-black"
          >
            <X size={12} /> 제거
          </button>
        )}
      </div>

      <input type="hidden" name={uploadedUrlName} value={uploadedUrl || ""} />

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={onInputChange}
        disabled={uploading}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
          <video
            src={preview}
            controls
            className="aspect-video w-full bg-black"
            preload="metadata"
          />
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
              <p className="text-sm font-medium">업로드 중… {progress}%</p>
              <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {!uploading && (
            <label
              htmlFor={inputId}
              className="absolute inset-x-3 bottom-3 inline-flex cursor-pointer justify-center rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
            >
              영상 바꾸기
            </label>
          )}
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
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition ${
            dragging
              ? "border-black bg-black/[0.03]"
              : "border-line bg-[#fafafa] hover:border-black/25 hover:bg-black/[0.02]"
          }`}
        >
          <Film size={22} className="text-black/45" />
          <p className="mt-2 text-sm font-medium">클릭하거나 영상을 끌어다 놓기</p>
          <p className="mt-1 text-[11px] text-muted">{hint}</p>
        </label>
      )}

      {error && <p className="text-xs text-[#c81e1e]">{error}</p>}
      {fileName && !error && (
        <p className="truncate text-[11px] text-muted">
          {fileName}
          {uploadedUrl
            ? " · Blob 업로드 완료"
            : serverFallback
              ? " · 등록 시 서버로 업로드"
              : ""}
        </p>
      )}
    </div>
  );
}

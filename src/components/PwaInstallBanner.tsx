"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIosInstallable() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !isStandaloneDisplay();
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (isStandaloneDisplay()) return;

    if (isIosInstallable()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferredPrompt(null);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex justify-center px-4"
      role="region"
      aria-label="Install app"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">LEE YEON 앱 설치</p>
          {iosHint ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              Safari 공유 버튼을 누른 뒤 「홈 화면에 추가」를 선택하세요.
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted">
              홈 화면에 추가해 더 빠르게 팬 커뮤니티를 이용하세요.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!iosHint && deferredPrompt && (
            <button
              type="button"
              onClick={() => void install()}
              className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
            >
              <Download size={14} aria-hidden />
              설치
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-muted hover:bg-black/5"
            aria-label="Dismiss install banner"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

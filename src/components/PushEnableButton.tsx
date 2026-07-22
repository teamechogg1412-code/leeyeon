"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, LoaderCircle } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushEnableButton({
  vapidPublicKey,
}: {
  vapidPublicKey: string | null;
}) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok || !vapidPublicKey) return;

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setEnabled(Boolean(sub));
      } catch {
        setEnabled(false);
      }
    })();
  }, [vapidPublicKey]);

  async function enable() {
    if (!vapidPublicKey) {
      setMessage("서버에 VAPID 키가 설정되지 않았습니다.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("알림 권한이 거부되었습니다.");
        return;
      }

      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "구독 저장 실패");
      }
      setEnabled(true);
      setMessage("브라우저 푸시가 켜졌습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "푸시를 켤 수 없습니다."
      );
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      } else {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }
      setEnabled(false);
      setMessage("브라우저 푸시가 꺼졌습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "푸시를 끌 수 없습니다."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </p>
    );
  }

  if (!vapidPublicKey) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
        푸시 알림은 VAPID 키 설정 후 사용할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">브라우저 푸시</p>
          <p className="mt-0.5 text-[11px] text-muted">
            새 콘텐츠·일정·From 알림을 OS 알림으로 받습니다.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void (enabled ? disable() : enable())}
          className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : enabled ? (
            <BellOff size={14} />
          ) : (
            <BellRing size={14} />
          )}
          {busy ? "처리 중" : enabled ? "끄기" : "켜기"}
        </button>
      </div>
      {message && <p className="mt-2 text-[11px] text-muted">{message}</p>}
    </div>
  );
}

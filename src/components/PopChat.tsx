"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { sendPopMessageAction } from "@/lib/actions";
import { UserAvatar } from "@/components/UserAvatar";
import { UserBadges } from "@/components/UserBadges";

type PopMsg = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    role: string;
    image?: string | null;
    tierLabel?: string | null;
    badgeColor?: string | null;
  };
};

function mergeMessages(prev: PopMsg[], incoming: PopMsg[]) {
  if (!incoming.length) return prev;
  const ids = new Set(prev.map((m) => m.id));
  const next = incoming.filter((m) => !ids.has(m.id));
  return next.length ? [...prev, ...next] : prev;
}

export function PopChat({
  roomId,
  initialMessages,
  canChat,
  lockedReason,
  currentUser,
}: {
  roomId: string;
  initialMessages: PopMsg[];
  canChat: boolean;
  lockedReason?: string;
  currentUser?: {
    id: string;
    nickname: string;
    role: string;
    image?: string | null;
    tierLabel?: string | null;
    badgeColor?: string | null;
  } | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [live, setLive] = useState(false);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef(initialMessages.at(-1)?.id || "");

  useEffect(() => {
    latestIdRef.current = messages.at(-1)?.id || latestIdRef.current;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const applyIncoming = (incoming: PopMsg[]) => {
      if (!incoming.length) return;
      setMessages((prev) => mergeMessages(prev, incoming));
      latestIdRef.current = incoming[incoming.length - 1]?.id || latestIdRef.current;
    };

    const startPolling = () => {
      if (pollTimer || stopped) return;
      setLive(false);
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/pop/${roomId}/messages?after=${latestIdRef.current || ""}`,
            { cache: "no-store" }
          );
          if (!res.ok) return;
          const data = (await res.json()) as { messages: PopMsg[] };
          applyIncoming(data.messages || []);
        } catch {
          // ignore
        }
      }, 2000);
    };

    const startStream = () => {
      const after = latestIdRef.current
        ? `?after=${encodeURIComponent(latestIdRef.current)}`
        : "";
      es = new EventSource(`/api/pop/${roomId}/stream${after}`);

      es.addEventListener("ready", () => setLive(true));
      es.addEventListener("messages", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            messages: PopMsg[];
          };
          applyIncoming(data.messages || []);
        } catch {
          // ignore bad payloads
        }
      });
      es.onerror = () => {
        es?.close();
        es = null;
        setLive(false);
        startPolling();
      };
    };

    startStream();

    return () => {
      stopped = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [roomId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !canChat || !currentUser) return;
    setBody("");

    const optimistic: PopMsg = {
      id: `temp-${Date.now()}`,
      body: text,
      createdAt: new Date().toISOString(),
      author: currentUser,
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const form = new FormData();
      form.set("roomId", roomId);
      form.set("body", text);
      await sendPopMessageAction(form);
      try {
        const res = await fetch(
          `/api/pop/${roomId}/messages?after=${latestIdRef.current || ""}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = (await res.json()) as { messages: PopMsg[] };
          setMessages((prev) => {
            const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"));
            return mergeMessages(withoutTemp, data.messages || []);
          });
        }
      } catch {
        // stream/polling will catch up
      }
    });
  }

  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-[11px] text-muted">
        <span>{live ? "실시간 연결됨" : "연결 재시도 중…"}</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {live ? "LIVE SSE" : "Polling"}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          return (
            <div key={msg.id} className="flex gap-2.5">
              <UserAvatar
                nickname={msg.author.nickname}
                image={msg.author.image}
                size={32}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium">
                    {msg.author.nickname}
                  </span>
                  <UserBadges
                    role={msg.author.role}
                    tierLabel={msg.author.tierLabel}
                    badgeColor={msg.author.badgeColor}
                  />
                  <time className="text-[11px] text-muted">
                    {format(new Date(msg.createdAt), "M/d HH:mm", {
                      locale: ko,
                    })}
                  </time>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed">
                  {msg.body}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            {canChat
              ? "첫 메시지를 남겨보세요."
              : "아직 대화 내용이 없습니다."}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {canChat ? (
        <form
          onSubmit={onSubmit}
          className="flex gap-2 border-t border-line p-3"
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="메시지를 입력하세요"
            maxLength={500}
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-black/30"
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            전송
          </button>
        </form>
      ) : (
        <div className="border-t border-line px-4 py-3 text-center text-sm text-muted">
          {lockedReason || "이 POP에 참여하려면 로그인이 필요합니다."}
        </div>
      )}
    </div>
  );
}

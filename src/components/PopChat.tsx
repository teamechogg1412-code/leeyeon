"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { sendPopMessageAction } from "@/lib/actions";
import { avatarColor, avatarInitial } from "@/lib/avatar";

type PopMsg = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    role: string;
  };
};

export function PopChat({
  roomId,
  initialMessages,
  canChat,
  lockedReason,
}: {
  roomId: string;
  initialMessages: PopMsg[];
  canChat: boolean;
  lockedReason?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pop/${roomId}/messages?after=${latestId || ""}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { messages: PopMsg[] };
        if (data.messages?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const next = data.messages.filter((m) => !ids.has(m.id));
            return next.length ? [...prev, ...next] : prev;
          });
        }
      } catch {
        // ignore polling errors
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [roomId, latestId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !canChat) return;
    setBody("");
    startTransition(async () => {
      const form = new FormData();
      form.set("roomId", roomId);
      form.set("body", text);
      await sendPopMessageAction(form);
      const res = await fetch(`/api/pop/${roomId}/messages?after=`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { messages: PopMsg[] };
        if (data.messages) setMessages(data.messages);
      }
    });
  }

  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isOfficial =
            msg.author.role === "OWNER" || msg.author.role === "ADMIN";
          return (
            <div key={msg.id} className="flex gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: avatarColor(msg.author.nickname) }}
              >
                {avatarInitial(msg.author.nickname)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium">
                    {msg.author.nickname}
                  </span>
                  {isOfficial && (
                    <span className="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-medium text-white">
                      Manager
                    </span>
                  )}
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
            첫 메시지를 남겨보세요.
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

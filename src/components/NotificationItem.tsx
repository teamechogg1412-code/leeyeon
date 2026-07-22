"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions";

export function NotificationItem({
  id,
  href,
  title,
  body,
  createdAt,
  read,
  label,
  tone,
  Icon,
}: {
  id: string;
  href: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  label: string;
  tone: string;
  Icon: LucideIcon;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onOpen(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (!read) {
        const fd = new FormData();
        fd.set("id", id);
        await markNotificationReadAction(fd);
      }
      router.push(href);
      router.refresh();
    });
  }

  return (
    <Link
      href={href}
      onClick={onOpen}
      className={`flex gap-3 px-4 py-4 hover:bg-black/[0.02] ${
        read ? "bg-white" : "bg-[#faf8f5]"
      } ${pending ? "opacity-70" : ""}`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-muted">{label}</span>
          {!read && <span className="h-1.5 w-1.5 rounded-full bg-[#c81e1e]" />}
        </span>
        <span className="mt-0.5 block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
        <span className="mt-1.5 block text-[11px] text-black/35">
          {formatDistanceToNow(new Date(createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </span>
      </span>
    </Link>
  );
}

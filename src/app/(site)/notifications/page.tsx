import { redirect } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Heart,
  MessageCircle,
  Package,
  Radio,
  Sparkles,
  Star,
  Clapperboard,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsReadAction } from "@/lib/actions";
import { NotificationItem } from "@/components/NotificationItem";
import { PushEnableButton } from "@/components/PushEnableButton";
import { isPushConfigured } from "@/lib/pushConfig";

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: typeof Bell;
    tone: string;
  }
> = {
  COMMENT: {
    label: "댓글",
    icon: MessageCircle,
    tone: "bg-[#eef6f4] text-[#2f4a3c]",
  },
  REACTION: {
    label: "반응",
    icon: Heart,
    tone: "bg-[#fdeeee] text-[#a33b3b]",
  },
  MEMBERSHIP: {
    label: "멤버십",
    icon: Star,
    tone: "bg-[#f4f0e8] text-[#6b5535]",
  },
  ORDER: {
    label: "주문",
    icon: Package,
    tone: "bg-[#eef2f7] text-[#3a4550]",
  },
  FROM: {
    label: "From",
    icon: Sparkles,
    tone: "bg-[#f3eef8] text-[#5a3d6b]",
  },
  CONTENT: {
    label: "콘텐츠",
    icon: Clapperboard,
    tone: "bg-[#eef6f4] text-[#2f4a3c]",
  },
  SCHEDULE: {
    label: "일정",
    icon: CalendarDays,
    tone: "bg-[#eef2f7] text-[#3a4550]",
  },
  POP: {
    label: "POP",
    icon: Radio,
    tone: "bg-[#fdeeee] text-[#a33b3b]",
  },
  SYSTEM: {
    label: "알림",
    icon: Bell,
    tone: "bg-black/5 text-black/60",
  },
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.read).length;
  const vapidPublicKey = isPushConfigured()
    ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
    : null;

  return (
    <div className="page-shell max-w-xl space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-muted">
            {unread > 0
              ? `읽지 않은 알림 ${unread}개`
              : "모든 알림을 확인했습니다"}
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-black/5"
            >
              모두 읽음
            </button>
          </form>
        )}
      </div>

      <PushEnableButton vapidPublicKey={vapidPublicKey} />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface divide-y divide-line">
        {notifications.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">알림이 없습니다.</p>
        )}
        {notifications.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
          return (
            <NotificationItem
              key={n.id}
              id={n.id}
              href={n.href || "/"}
              title={n.title}
              body={n.body}
              createdAt={n.createdAt.toISOString()}
              read={n.read}
              label={meta.label}
              tone={meta.tone}
              Icon={meta.icon}
            />
          );
        })}
      </div>
    </div>
  );
}

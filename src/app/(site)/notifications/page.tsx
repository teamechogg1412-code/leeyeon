import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return (
    <div className="page-shell max-w-xl">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {notifications.length === 0 && (
          <p className="p-5 text-sm text-muted">알림이 없습니다.</p>
        )}
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.href || "/"}
            className="block px-5 py-4 hover:bg-black/[0.02]"
          >
            <p className="text-sm font-medium">{n.title}</p>
            <p className="mt-1 text-sm text-muted">{n.body}</p>
            <p className="mt-2 text-xs text-black/35">
              {format(n.createdAt, "yyyy.MM.dd HH:mm")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

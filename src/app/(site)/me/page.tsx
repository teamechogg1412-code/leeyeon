import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { formatPrice, getCurrentUserAccess } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { isMember } = await getCurrentUserAccess();
  const [membership, orders] = await Promise.all([
    prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        endsAt: { gt: new Date() },
      },
      include: { plan: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
  ]);

  return (
    <div className="page-shell max-w-xl">
      <h1 className="text-2xl font-semibold">My Page</h1>
      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="text-lg font-medium">{session.user.nickname}</p>
        <p className="mt-1 text-sm text-muted">{session.user.email}</p>
        <p className="mt-3 text-sm">
          멤버십:{" "}
          {isMember && membership
            ? `${membership.plan.name} (~${membership.endsAt.toLocaleDateString("ko-KR")})`
            : "미가입"}
        </p>
        {!isMember && (
          <Link
            href="/shop/membership"
            className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-xs text-white"
          >
            멤버십 가입
          </Link>
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold">주문 내역</h2>
      <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
        {orders.length === 0 && (
          <p className="p-5 text-sm text-muted">주문이 없습니다.</p>
        )}
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/shop/orders/${order.id}`}
            className="flex items-center justify-between px-5 py-4 text-sm hover:bg-black/[0.02]"
          >
            <div>
              <p className="font-medium">
                {order.items[0]?.title || order.type}
              </p>
              <p className="text-xs text-muted">
                {format(order.createdAt, "yyyy.MM.dd")} · {order.status}
              </p>
            </div>
            <span>{formatPrice(order.total)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

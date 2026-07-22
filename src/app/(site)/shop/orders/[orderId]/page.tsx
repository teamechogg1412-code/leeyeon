import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div className="page-shell max-w-lg py-10 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Order</p>
      <h1 className="mt-3 text-2xl font-semibold">주문이 완료되었습니다</h1>
      <p className="mt-2 text-sm text-muted">
        {format(order.createdAt, "yyyy.MM.dd HH:mm")} · {order.type}
      </p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-left">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold">
          <span>합계</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-full border border-line px-4 py-2 text-sm"
        >
          Shop
        </Link>
        <Link
          href="/me"
          className="rounded-full bg-black px-4 py-2 text-sm text-white"
        >
          내 정보
        </Link>
      </div>
    </div>
  );
}

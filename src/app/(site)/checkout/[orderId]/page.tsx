import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TossCheckout } from "@/components/TossCheckout";
import { auth } from "@/lib/auth";
import { isTossEnabled } from "@/lib/order";
import { formatPrice } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function CheckoutPage({
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

  if (order.status === "PAID") {
    redirect(`/shop/orders/${order.id}`);
  }

  if (!isTossEnabled()) {
    return (
      <div className="page-shell max-w-lg py-16 text-center">
        <h1 className="text-2xl font-semibold">Toss 키가 없습니다</h1>
        <p className="mt-3 text-sm text-muted">
          `.env`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`를 넣으면
          결제 위젯이 활성화됩니다. 지금은 데모 결제로 바로 처리됩니다.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm text-white"
        >
          Shop으로
        </Link>
      </div>
    );
  }

  const orderName = order.items[0]?.title || "FANSTAGE 주문";

  return (
    <div className="page-shell max-w-xl">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-muted">
        {orderName} · {formatPrice(order.total)}
      </p>
      <div className="mt-6">
        <TossCheckout
          orderId={order.id}
          orderCode={order.orderCode}
          orderName={orderName}
          amount={order.total}
          customerKey={session.user.id}
          customerName={session.user.nickname || session.user.name || "fan"}
          customerEmail={session.user.email || ""}
        />
      </div>
    </div>
  );
}

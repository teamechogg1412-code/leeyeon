import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { updateOrderAddressAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { formatPrice, getCurrentUserAccess } from "@/lib/stage";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  fulfillmentTone,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { orderId } = await params;
  const { saved, error } = await searchParams;
  const { isOwner } = await getCurrentUserAccess();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) notFound();
  if (order.userId !== session.user.id && !isOwner) notFound();

  const isProduct = order.type === "PRODUCT";
  const canEditAddress =
    isProduct &&
    order.userId === session.user.id &&
    order.status === "PAID" &&
    !["SHIPPED", "DELIVERED"].includes(order.fulfillmentStatus);

  return (
    <div className="page-shell max-w-lg space-y-6 py-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Order</p>
        <h1 className="mt-3 text-2xl font-semibold">
          {order.status === "PAID" ? "주문이 완료되었습니다" : "주문 상세"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {format(order.createdAt, "yyyy.MM.dd HH:mm")} · {order.orderCode}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px]">
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
          {isProduct && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${fulfillmentTone(order.fulfillmentStatus)}`}
            >
              {FULFILLMENT_LABELS[order.fulfillmentStatus] ||
                order.fulfillmentStatus}
            </span>
          )}
        </div>
      </div>

      {saved && (
        <p className="text-center text-sm text-[#2f4a3c]">
          배송지가 저장되었습니다.
        </p>
      )}
      {error === "address" && (
        <p className="text-center text-sm text-[#c81e1e]">
          수령인 · 연락처 · 주소를 모두 입력해 주세요.
        </p>
      )}
      {error === "locked" && (
        <p className="text-center text-sm text-[#c81e1e]">
          이미 배송이 시작된 주문은 주소를 변경할 수 없습니다.
        </p>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5 text-left">
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

      {isProduct && (
        <div className="rounded-2xl border border-line bg-surface p-5 text-left">
          <h2 className="text-sm font-semibold">배송 정보</h2>
          {(order.trackingNumber || order.trackingCarrier) && (
            <p className="mt-3 text-sm">
              {order.trackingCarrier || "택배"}{" "}
              <span className="font-medium">{order.trackingNumber}</span>
            </p>
          )}
          {order.shippedAt && (
            <p className="mt-1 text-xs text-muted">
              발송: {format(order.shippedAt, "yyyy.MM.dd HH:mm")}
            </p>
          )}
          {order.deliveredAt && (
            <p className="mt-1 text-xs text-muted">
              완료: {format(order.deliveredAt, "yyyy.MM.dd HH:mm")}
            </p>
          )}

          {canEditAddress ? (
            <form action={updateOrderAddressAction} className="mt-4 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input
                name="recipientName"
                required
                defaultValue={order.recipientName || ""}
                placeholder="수령인"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
              />
              <input
                name="recipientPhone"
                required
                defaultValue={order.recipientPhone || ""}
                placeholder="연락처"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
              />
              <input
                name="zipCode"
                defaultValue={order.zipCode || ""}
                placeholder="우편번호"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
              />
              <input
                name="addressLine1"
                required
                defaultValue={order.addressLine1 || ""}
                placeholder="주소"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
              />
              <input
                name="addressLine2"
                defaultValue={order.addressLine2 || ""}
                placeholder="상세 주소"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-black px-4 py-2 text-sm text-white"
              >
                배송지 저장
              </button>
            </form>
          ) : (
            <div className="mt-3 space-y-1 text-sm text-muted">
              {order.recipientName ? (
                <>
                  <p>
                    {order.recipientName} · {order.recipientPhone}
                  </p>
                  <p>
                    {order.zipCode && `[${order.zipCode}] `}
                    {order.addressLine1} {order.addressLine2}
                  </p>
                </>
              ) : (
                <p>배송지가 아직 입력되지 않았습니다.</p>
              )}
            </div>
          )}
        </div>
      )}

      {!isProduct && (
        <p className="text-center text-sm text-muted">
          멤버십 주문은 배송이 없는 디지털 상품입니다.
        </p>
      )}

      <div className="flex justify-center gap-3">
        {isOwner && (
          <Link
            href={`/admin/orders/${order.id}`}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            관리
          </Link>
        )}
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

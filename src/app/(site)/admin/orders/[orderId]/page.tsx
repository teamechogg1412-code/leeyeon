import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { updateOrderFulfillmentAction } from "@/lib/actions";
import { formatPrice, getCurrentUserAccess } from "@/lib/stage";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  fulfillmentTone,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { isOwner } = await getCurrentUserAccess();
  if (!isOwner) redirect("/login");

  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { nickname: true, email: true, name: true } },
      items: true,
    },
  });
  if (!order) notFound();

  const isProduct = order.type === "PRODUCT";

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="text-xs text-muted hover:text-black"
        >
          ← 주문 목록
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">주문 상세</h1>
        <p className="mt-1 text-sm text-muted">{order.orderCode}</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${fulfillmentTone(order.fulfillmentStatus)}`}
          >
            {FULFILLMENT_LABELS[order.fulfillmentStatus] ||
              order.fulfillmentStatus}
          </span>
          <span className="text-xs text-muted">
            {ORDER_STATUS_LABELS[order.status] || order.status} · {order.type}
          </span>
        </div>
        <p className="mt-3 text-sm">
          {order.user.name} ({order.user.nickname}) · {order.user.email}
        </p>
        <p className="mt-1 text-xs text-muted">
          {format(order.createdAt, "yyyy.MM.dd HH:mm")}
        </p>

        <div className="mt-5 space-y-2 border-t border-line pt-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-3 text-sm"
            >
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-3 font-semibold">
            <span>합계</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <form
        action={updateOrderFulfillmentAction}
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
      >
        <h2 className="font-semibold">배송 · 이행 관리</h2>
        <input type="hidden" name="orderId" value={order.id} />

        <label className="block text-xs text-muted">상태</label>
        <select
          name="fulfillmentStatus"
          defaultValue={order.fulfillmentStatus}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        >
          {(isProduct
            ? ["READY", "PREPARING", "SHIPPED", "DELIVERED"]
            : ["NONE", "READY", "PREPARING", "SHIPPED", "DELIVERED"]
          ).map((s) => (
            <option key={s} value={s}>
              {FULFILLMENT_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted">수령인</label>
            <input
              name="recipientName"
              defaultValue={order.recipientName || ""}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">연락처</label>
            <input
              name="recipientPhone"
              defaultValue={order.recipientPhone || ""}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">우편번호</label>
          <input
            name="zipCode"
            defaultValue={order.zipCode || ""}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">주소</label>
          <input
            name="addressLine1"
            defaultValue={order.addressLine1 || ""}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">상세 주소</label>
          <input
            name="addressLine2"
            defaultValue={order.addressLine2 || ""}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted">택배사</label>
            <input
              name="trackingCarrier"
              defaultValue={order.trackingCarrier || ""}
              placeholder="예: CJ대한통운"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">송장번호</label>
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber || ""}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">관리자 메모</label>
          <textarea
            name="adminNote"
            rows={3}
            defaultValue={order.adminNote || ""}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-black px-4 py-2 text-sm text-white"
        >
          저장
        </button>
      </form>

      <Link
        href={`/shop/orders/${order.id}`}
        className="inline-flex text-sm text-muted underline"
      >
        팬 화면에서 보기
      </Link>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { FilterChips, SearchBar } from "@/components/SearchFilters";
import { buildQuery } from "@/lib/search";
import { formatPrice, getCurrentUserAccess } from "@/lib/stage";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  fulfillmentTone,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    fulfill?: string;
    status?: string;
  }>;
}) {
  const { isOwner } = await getCurrentUserAccess();
  if (!isOwner) redirect("/login");

  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const type = sp.type === "PRODUCT" || sp.type === "MEMBERSHIP" ? sp.type : "";
  const fulfill = ["READY", "PREPARING", "SHIPPED", "DELIVERED", "NONE"].includes(
    sp.fulfill || ""
  )
    ? (sp.fulfill as string)
    : "";
  const status = ["PENDING", "PAID", "CANCELLED", "REFUNDED"].includes(
    sp.status || ""
  )
    ? (sp.status as string)
    : "";

  const where: Prisma.OrderWhereInput = {
    ...(type ? { type } : {}),
    ...(fulfill ? { fulfillmentStatus: fulfill } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { orderCode: { contains: q, mode: "insensitive" } },
            { user: { nickname: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { items: { some: { title: { contains: q, mode: "insensitive" } } } },
            { trackingNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { nickname: true, email: true } },
      items: { take: 2 },
    },
  });

  const base = { q, type, fulfill, status };

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs text-muted hover:text-black">
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">주문 · 배송 관리</h1>
          <p className="mt-1 text-sm text-muted">최근 50건</p>
        </div>
      </div>

      <SearchBar
        action="/admin/orders"
        q={q}
        placeholder="주문번호 · 닉네임 · 상품 · 송장"
        preserve={{
          type,
          fulfill,
          status,
        }}
      />

      <div className="space-y-2">
        <FilterChips
          items={[
            {
              label: "전체 유형",
              href: `/admin/orders${buildQuery({ ...base, type: "" })}`,
              active: !type,
            },
            {
              label: "상품",
              href: `/admin/orders${buildQuery({ ...base, type: "PRODUCT" })}`,
              active: type === "PRODUCT",
            },
            {
              label: "멤버십",
              href: `/admin/orders${buildQuery({ ...base, type: "MEMBERSHIP" })}`,
              active: type === "MEMBERSHIP",
            },
          ]}
        />
        <FilterChips
          items={[
            {
              label: "배송 전체",
              href: `/admin/orders${buildQuery({ ...base, fulfill: "" })}`,
              active: !fulfill,
            },
            ...(["READY", "PREPARING", "SHIPPED", "DELIVERED"] as const).map(
              (f) => ({
                label: FULFILLMENT_LABELS[f],
                href: `/admin/orders${buildQuery({ ...base, fulfill: f })}`,
                active: fulfill === f,
              })
            ),
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">주문이 없습니다.</p>
        ) : (
          <div className="divide-y divide-line">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm hover:bg-black/[0.02]"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {order.items[0]?.title || order.type}
                    {order.items.length > 1 ? ` 외 ${order.items.length - 1}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {order.orderCode} · {order.user.nickname} ·{" "}
                    {format(order.createdAt, "yyyy.MM.dd HH:mm")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${fulfillmentTone(order.fulfillmentStatus)}`}
                  >
                    {FULFILLMENT_LABELS[order.fulfillmentStatus] ||
                      order.fulfillmentStatus}
                  </span>
                  <div>
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <p className="text-[11px] text-muted">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

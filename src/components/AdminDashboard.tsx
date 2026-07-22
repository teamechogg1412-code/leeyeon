import Link from "next/link";
import { format } from "date-fns";
import { formatPrice } from "@/lib/format";
import type { OwnerDashboardStats } from "@/lib/adminStats";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function MiniBars({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5">
      {values.map((v, i) => {
        const h = Math.max(4, Math.round((v / max) * 88));
        return (
          <div
            key={labels[i]}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className="w-full rounded-t bg-black/80"
              style={{ height: `${h}px` }}
              title={`${labels[i]}: ${v}`}
            />
            <span className="text-[10px] text-muted">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminDashboard({ stats }: { stats: OwnerDashboardStats }) {
  const { overview, last7, recentOrders, topContents, memberBreakdown, daily } =
    stats;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fans"
          value={overview.fans}
          hint={`7일 +${last7.newFans}`}
        />
        <StatCard
          label="Active members"
          value={overview.activeMembers}
          hint={`스태프 ${overview.owners}`}
        />
        <StatCard
          label="Revenue (PAID)"
          value={formatPrice(overview.revenueTotal)}
          hint={`30일 ${formatPrice(overview.revenue30)}`}
        />
        <StatCard
          label="Orders"
          value={overview.paidOrders}
          hint={`대기 ${overview.pendingOrders} · 7일 +${last7.paidOrders}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Posts" value={overview.posts} hint={`7일 +${last7.newPosts}`} />
        <StatCard label="Contents" value={overview.contents} />
        <StatCard label="From" value={overview.stories} />
        <StatCard label="POP messages" value={overview.popMessages} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">7일 신규 팬</h2>
          <p className="mt-1 text-xs text-muted">일별 가입 수</p>
          <div className="mt-4">
            <MiniBars
              values={daily.map((d) => d.fans)}
              labels={daily.map((d) => d.label)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">7일 결제 건수</h2>
          <p className="mt-1 text-xs text-muted">PAID 주문</p>
          <div className="mt-4">
            <MiniBars
              values={daily.map((d) => d.orders)}
              labels={daily.map((d) => d.label)}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">멤버십 현황</h2>
          {memberBreakdown.length === 0 ? (
            <p className="text-sm text-muted">활성 멤버가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {memberBreakdown.map((row) => (
                <li
                  key={row.planId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    {row.tierLabel && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                        style={{ background: row.badgeColor || "#1a1a1a" }}
                      >
                        {row.tierLabel}
                      </span>
                    )}
                    {row.name}
                  </span>
                  <span className="font-semibold">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">인기 콘텐츠</h2>
          {topContents.length === 0 ? (
            <p className="text-sm text-muted">콘텐츠가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {topContents.map((c, i) => (
                <li key={c.id}>
                  <Link
                    href={`/contents/${c.id}`}
                    className="flex items-center justify-between gap-3 text-sm hover:underline"
                  >
                    <span className="min-w-0 truncate">
                      <span className="mr-2 text-muted">{i + 1}.</span>
                      {c.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      조회 {c.viewCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">최근 주문</h2>
          <Link
            href="/admin/orders"
            className="text-[11px] text-muted hover:text-black"
          >
            전체 보기
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted">주문이 없습니다.</p>
        ) : (
          <div className="divide-y divide-line">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:bg-black/[0.015]"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {order.items[0]?.title || order.type}
                  </p>
                  <p className="text-xs text-muted">
                    {order.user.nickname} ·{" "}
                    {format(order.createdAt, "yyyy.MM.dd HH:mm")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(order.total)}</p>
                  <p className="text-[11px] text-muted">{order.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

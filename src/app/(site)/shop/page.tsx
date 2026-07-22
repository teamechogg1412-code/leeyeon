import Link from "next/link";
import { redirect } from "next/navigation";
import { purchaseMembershipAction } from "@/lib/actions";
import { FilterChips, SearchBar } from "@/components/SearchFilters";
import { buildQuery } from "@/lib/search";
import { formatPrice, getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Tab = "all" | "md" | "membership";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const q = (qRaw || "").trim();
  const stage = await getStage();
  const { isOwner } = await getCurrentUserAccess();

  const shopOpen = stage.shopEnabled || isOwner;
  let tab = (["all", "md", "membership"].includes(tabRaw || "")
    ? tabRaw
    : "all") as Tab;
  if (!shopOpen) {
    tab = "membership";
  }

  const planWhere: Prisma.MembershipPlanWhereInput = {
    stageId: stage.id,
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const productWhere: Prisma.ProductWhereInput = {
    stageId: stage.id,
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [plans, products] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: planWhere,
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    }),
    shopOpen
      ? prisma.product.findMany({
          where: productWhere,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const tabs: { key: Tab; label: string }[] = shopOpen
    ? [
        { key: "all", label: "ALL" },
        { key: "membership", label: "Membership" },
        { key: "md", label: "MD" },
      ]
    : [{ key: "membership", label: "Membership" }];

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          {shopOpen ? "Shop" : "Membership"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {shopOpen
            ? "멤버십과 공식 MD"
            : "공식 멤버십"}
          {!stage.shopEnabled && isOwner && (
            <span className="ml-2 text-[11px] text-muted">
              (오너 미리보기 · Shop 비공개 중)
            </span>
          )}
        </p>
      </div>

      <SearchBar
        action="/shop"
        q={q}
        placeholder="상품 · 멤버십 검색"
        preserve={{ tab: tab === "all" ? "" : tab }}
      />

      <FilterChips
        items={tabs.map((t) => ({
          label: t.label,
          href: `/shop${buildQuery({ tab: t.key === "all" ? "" : t.key, q })}`,
          active: tab === t.key,
        }))}
      />

      {(tab === "all" || tab === "membership") && (
        <section>
          {tab === "all" && (
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-base font-semibold">Membership</h2>
              <Link
                href={`/shop${buildQuery({ tab: "membership", q })}`}
                className="text-xs text-muted hover:text-black"
              >
                Go to Membership &gt;
              </Link>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="overflow-hidden rounded-xl border border-line bg-surface"
              >
                <div className="flex aspect-square items-end bg-gradient-to-br from-[#111] to-[#333] p-5 text-white">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                      Membership
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
                    {plan.tierLabel && (
                      <span
                        className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: plan.badgeColor || "#444" }}
                      >
                        {plan.tierLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm text-muted">
                    {plan.description}
                  </p>
                  <p className="mt-3 text-[17px] font-semibold">
                    {formatPrice(plan.price)}
                  </p>
                  <form action={purchaseMembershipAction.bind(null, plan.id)}>
                    <button
                      type="submit"
                      className="mt-4 w-full rounded-full bg-black py-2.5 text-sm text-white"
                    >
                      가입하기
                    </button>
                  </form>
                  <Link
                    href="/shop/membership"
                    className="mt-2 block text-center text-xs text-muted hover:text-black"
                  >
                    혜택 자세히
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {plans.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              검색된 멤버십이 없습니다.
            </p>
          )}
        </section>
      )}

      {(tab === "all" || tab === "md") && (
        <section className={tab === "all" ? "mt-4" : ""}>
          {tab === "all" && (
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-base font-semibold">MD</h2>
              <Link
                href={`/shop${buildQuery({ tab: "md", q })}`}
                className="text-xs text-muted hover:text-black"
              >
                Go to MD &gt;
              </Link>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const soldOut = product.stock < 1;
              return (
                <Link
                  key={product.id}
                  href={`/shop/products/${product.id}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f0eeea]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#ece7e1] to-[#d8cfc4] text-xs text-black/30">
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-[14px] leading-snug">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 text-[15px] font-semibold">
                    {formatPrice(product.price)}
                  </p>
                  {soldOut && (
                    <span className="mt-2 inline-block bg-black px-2 py-1 text-[11px] text-white">
                      Sold out
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          {products.length === 0 && (
            <p className="py-16 text-center text-sm text-muted">
              {q ? "검색 결과가 없습니다." : "등록된 상품이 없습니다."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

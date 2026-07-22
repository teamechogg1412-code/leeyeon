import Link from "next/link";
import { purchaseMembershipAction } from "@/lib/actions";
import { formatPrice, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

type Tab = "all" | "md" | "membership";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabRaw } = await searchParams;
  const tab = (["all", "md", "membership"].includes(tabRaw || "")
    ? tabRaw
    : "all") as Tab;

  const stage = await getStage();
  const [plans, products] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { stageId: stage.id, active: true },
    }),
    prisma.product.findMany({
      where: { stageId: stage.id, active: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "ALL" },
    { key: "membership", label: "Membership" },
    { key: "md", label: "MD" },
  ];

  return (
    <div className="page-shell">
      <nav className="flex gap-6 border-b border-line text-[14px]">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/shop?tab=${t.key}`}
            className={`-mb-px border-b-2 pb-3 ${
              tab === t.key
                ? "border-black font-semibold text-black"
                : "border-transparent text-black/45 hover:text-black"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {(tab === "all" || tab === "membership") && (
        <section className="mt-8">
          {tab === "all" && (
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-base font-semibold">Membership</h2>
              <Link
                href="/shop?tab=membership"
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
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted line-clamp-2">
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
        </section>
      )}

      {(tab === "all" || tab === "md") && (
        <section className={tab === "all" ? "mt-12" : "mt-8"}>
          {tab === "all" && (
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-base font-semibold">MD</h2>
              <Link
                href="/shop?tab=md"
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
              등록된 상품이 없습니다.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

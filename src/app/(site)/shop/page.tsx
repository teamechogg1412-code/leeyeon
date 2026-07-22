import Link from "next/link";
import {
  purchaseMembershipAction,
  purchaseProductAction,
} from "@/lib/actions";
import { formatPrice, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function ShopPage() {
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

  return (
    <div className="page-shell space-y-14">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Shop
        </h1>
        <p className="mt-2 text-sm text-muted">
          멤버십과 공식 MD를 한곳에서
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Membership</h2>
          <Link href="/shop/membership" className="text-xs text-muted">
            자세히
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>
              <p className="mt-4 text-2xl font-semibold">
                {formatPrice(plan.price)}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-black/70">
                {plan.benefits.split("|").map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
              <form action={purchaseMembershipAction.bind(null, plan.id)}>
                <button
                  type="submit"
                  className="mt-6 rounded-full bg-black px-5 py-2.5 text-sm text-white"
                >
                  가입하기 (데모 결제)
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">MD</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 bg-gradient-to-br from-[#ece7e1] to-[#d8cfc4]" />
              )}
              <div className="p-4">
                <h3 className="font-medium">{product.name}</h3>
                <p className="mt-1 text-xs text-muted">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  <form action={purchaseProductAction.bind(null, product.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-black/15 px-3 py-1.5 text-xs"
                    >
                      구매
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

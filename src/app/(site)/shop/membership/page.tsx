import Link from "next/link";
import { purchaseMembershipAction } from "@/lib/actions";
import {
  formatPrice,
  getCurrentUserAccess,
  getStage,
} from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function MembershipPage() {
  const stage = await getStage();
  const { isMember, session } = await getCurrentUserAccess();
  const plans = await prisma.membershipPlan.findMany({
    where: { stageId: stage.id, active: true },
  });

  const membership = session?.user?.id
    ? await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
          endsAt: { gt: new Date() },
        },
        include: { plan: true },
      })
    : null;

  return (
    <div className="page-shell max-w-3xl">
      <Link href="/shop?tab=membership" className="text-sm text-muted">
        ← Shop
      </Link>
      <h1 className="mt-4 text-[28px] font-semibold tracking-tight">
        Membership
      </h1>
      <p className="mt-2 text-sm text-muted">
        디지털 회원카드 · 전용 콘텐츠 · 전용 커뮤니티
      </p>

      {isMember && membership && (
        <div className="relative mt-8 overflow-hidden rounded-3xl bg-[#111] p-7 text-white shadow-lg">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 80% 20%, #444, transparent 40%)",
            }}
          />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">
              Digital Member Card
            </p>
            <p className="mt-5 font-[family-name:var(--font-display)] text-4xl">
              {stage.name}
            </p>
            <p className="mt-3 text-sm text-white/70">
              {session?.user?.nickname}
            </p>
            <div className="mt-8 flex items-end justify-between gap-4">
              <p className="text-sm text-white/80">{membership.plan.name}</p>
              <p className="text-xs text-white/45">
                ~ {membership.endsAt.toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted">{plan.description}</p>
            <p className="mt-4 text-2xl font-semibold">
              {formatPrice(plan.price)}
              <span className="ml-2 text-sm font-normal text-muted">
                / {plan.durationDays}일
              </span>
            </p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {plan.benefits.split("|").map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
            {!isMember && (
              <form action={purchaseMembershipAction.bind(null, plan.id)}>
                <button
                  type="submit"
                  className="mt-6 w-full rounded-full bg-black px-5 py-2.5 text-sm text-white"
                >
                  {session ? "가입하기 (데모 결제)" : "로그인 후 가입"}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { purchaseMembershipAction } from "@/lib/actions";
import {
  formatPrice,
  getCurrentUserAccess,
  getStage,
} from "@/lib/stage";
import { getActiveMembership } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/MemberCard";

export default async function MembershipPage() {
  const stage = await getStage();
  const { isMember, session } = await getCurrentUserAccess();
  const plans = await prisma.membershipPlan.findMany({
    where: { stageId: stage.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });

  const membership = session?.user?.id
    ? await getActiveMembership(session.user.id, stage.id)
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
        <div className="mt-8">
          <MemberCard
            stageName={stage.name}
            nickname={session?.user?.nickname || ""}
            planName={membership.plan.name}
            tierLabel={membership.plan.tierLabel}
            badgeColor={membership.plan.badgeColor}
            endsAt={membership.endsAt}
          />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {plan.tierLabel && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ background: plan.badgeColor || "#1a1a1a" }}
                >
                  {plan.tierLabel}
                </span>
              )}
            </div>
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

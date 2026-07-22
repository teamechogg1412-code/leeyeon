import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { formatPrice, getCurrentUserAccess, getStage } from "@/lib/stage";
import { getActiveMembership } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/UserAvatar";
import { UserBadges } from "@/components/UserBadges";
import { MemberCard } from "@/components/MemberCard";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stage = await getStage();
  const { isMember, isOwner } = await getCurrentUserAccess();

  const [user, membership, orders] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    getActiveMembership(session.user.id, stage.id),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
  ]);

  const showCard = Boolean(membership);

  return (
    <div className="page-shell max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold">My Page</h1>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start gap-4">
          <UserAvatar
            nickname={user.nickname}
            image={user.image}
            size={64}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-medium">{user.nickname}</p>
              <UserBadges
                role={user.role}
                tierLabel={
                  membership?.plan.tierLabel || membership?.plan.name || null
                }
                badgeColor={membership?.plan.badgeColor}
              />
            </div>
            <p className="mt-0.5 text-sm text-muted">{user.email}</p>
            {user.bio && (
              <p className="mt-2 text-sm text-black/75">{user.bio}</p>
            )}
            <p className="mt-3 text-sm">
              멤버십:{" "}
              {membership
                ? `${membership.plan.name} (~${membership.endsAt.toLocaleDateString("ko-KR")})`
                : isOwner
                  ? "Official"
                  : "미가입"}
            </p>
            {!isMember && (
              <Link
                href="/shop/membership"
                className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-xs text-white"
              >
                멤버십 가입
              </Link>
            )}
          </div>
        </div>
      </div>

      {showCard && membership && (
        <MemberCard
          stageName={stage.name}
          nickname={user.nickname}
          planName={membership.plan.name}
          tierLabel={membership.plan.tierLabel}
          badgeColor={membership.plan.badgeColor}
          endsAt={membership.endsAt}
        />
      )}

      <div className="rounded-2xl border border-line bg-surface p-5">
        <ProfileEditForm
          name={user.name}
          nickname={user.nickname}
          bio={user.bio || ""}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold">주문 내역</h2>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
          {orders.length === 0 && (
            <p className="p-5 text-sm text-muted">주문이 없습니다.</p>
          )}
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/shop/orders/${order.id}`}
              className="flex items-center justify-between px-5 py-4 text-sm hover:bg-black/[0.02]"
            >
              <div>
                <p className="font-medium">
                  {order.items[0]?.title || order.type}
                </p>
                <p className="text-xs text-muted">
                  {format(order.createdAt, "yyyy.MM.dd")} · {order.status}
                </p>
              </div>
              <span>{formatPrice(order.total)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

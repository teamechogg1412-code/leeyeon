import { prisma } from "@/lib/prisma";

export type AuthorBadge = {
  tierLabel: string | null;
  badgeColor: string | null;
};

/** Map userId → active plan badge for a stage. */
export async function getMembershipBadgeMap(
  userIds: string[],
  stageId: string
): Promise<Map<string, AuthorBadge>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, AuthorBadge>();
  if (unique.length === 0) return map;

  const memberships = await prisma.membership.findMany({
    where: {
      userId: { in: unique },
      status: "ACTIVE",
      endsAt: { gt: new Date() },
      plan: { stageId },
    },
    include: {
      plan: {
        select: { tierLabel: true, badgeColor: true, name: true },
      },
    },
  });

  for (const m of memberships) {
    map.set(m.userId, {
      tierLabel: m.plan.tierLabel || m.plan.name,
      badgeColor: m.plan.badgeColor || "#1a1a1a",
    });
  }
  return map;
}

export async function getActiveMembership(
  userId: string | null | undefined,
  stageId?: string
) {
  if (!userId) return null;
  return prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endsAt: { gt: new Date() },
      ...(stageId ? { plan: { stageId } } : {}),
    },
    include: { plan: true },
  });
}

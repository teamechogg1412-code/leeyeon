import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getOwnerDashboardStats(stageId: string) {
  const now = new Date();
  const day7 = startOfDay(subDays(now, 6));
  const day30 = startOfDay(subDays(now, 29));

  const [
    fanCount,
    ownerCount,
    activeMembers,
    postCount,
    contentCount,
    productCount,
    storyCount,
    popMessageCount,
    orderPaid,
    orderPending,
    revenueAgg,
    revenue30Agg,
    newFans7,
    newOrders7,
    newPosts7,
    recentOrders,
    topContents,
    membershipByPlan,
    dailyFans,
    dailyOrders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "FAN" } }),
    prisma.user.count({ where: { role: { in: ["OWNER", "ADMIN"] } } }),
    prisma.membership.count({
      where: {
        status: "ACTIVE",
        endsAt: { gt: now },
        plan: { stageId },
      },
    }),
    prisma.post.count({ where: { board: { stageId } } }),
    prisma.content.count({ where: { stageId } }),
    prisma.product.count({ where: { stageId, active: true } }),
    prisma.story.count({ where: { stageId } }),
    prisma.popMessage.count({ where: { room: { stageId } } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: day30 } },
      _sum: { total: true },
    }),
    prisma.user.count({
      where: { role: "FAN", createdAt: { gte: day7 } },
    }),
    prisma.order.count({
      where: { status: "PAID", createdAt: { gte: day7 } },
    }),
    prisma.post.count({
      where: { board: { stageId }, createdAt: { gte: day7 } },
    }),
    prisma.order.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { nickname: true, email: true } },
        items: { take: 1 },
      },
    }),
    prisma.content.findMany({
      where: { stageId },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        viewCount: true,
        category: true,
        membershipRequired: true,
      },
    }),
    prisma.membership.groupBy({
      by: ["planId"],
      where: {
        status: "ACTIVE",
        endsAt: { gt: now },
        plan: { stageId },
      },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { role: "FAN", createdAt: { gte: day7 } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { status: "PAID", createdAt: { gte: day7 } },
      select: { createdAt: true, total: true },
    }),
  ]);

  const plans = await prisma.membershipPlan.findMany({
    where: { stageId },
    select: { id: true, name: true, tierLabel: true, badgeColor: true },
  });
  const planMap = new Map(plans.map((p) => [p.id, p]));

  const memberBreakdown = membershipByPlan.map((row) => {
    const plan = planMap.get(row.planId);
    return {
      planId: row.planId,
      name: plan?.name || "Unknown",
      tierLabel: plan?.tierLabel,
      badgeColor: plan?.badgeColor,
      count: row._count._all,
    };
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = startOfDay(subDays(now, 6 - i));
    const key = format(d, "yyyy-MM-dd");
    return { date: d, key, label: format(d, "M/d"), fans: 0, orders: 0, revenue: 0 };
  });
  const dayIndex = new Map(days.map((d, i) => [d.key, i]));

  for (const u of dailyFans) {
    const key = format(startOfDay(u.createdAt), "yyyy-MM-dd");
    const idx = dayIndex.get(key);
    if (idx !== undefined) days[idx].fans += 1;
  }
  for (const o of dailyOrders) {
    const key = format(startOfDay(o.createdAt), "yyyy-MM-dd");
    const idx = dayIndex.get(key);
    if (idx !== undefined) {
      days[idx].orders += 1;
      days[idx].revenue += o.total;
    }
  }

  return {
    overview: {
      fans: fanCount,
      owners: ownerCount,
      activeMembers,
      posts: postCount,
      contents: contentCount,
      products: productCount,
      stories: storyCount,
      popMessages: popMessageCount,
      paidOrders: orderPaid,
      pendingOrders: orderPending,
      revenueTotal: revenueAgg._sum.total || 0,
      revenue30: revenue30Agg._sum.total || 0,
    },
    last7: {
      newFans: newFans7,
      paidOrders: newOrders7,
      newPosts: newPosts7,
    },
    recentOrders,
    topContents,
    memberBreakdown,
    daily: days,
  };
}

export type OwnerDashboardStats = Awaited<
  ReturnType<typeof getOwnerDashboardStats>
>;

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getStage() {
  const stage = await prisma.stage.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!stage) throw new Error("Stage not found. Run seed.");
  return stage;
}

export async function hasActiveMembership(userId?: string | null) {
  if (!userId) return false;
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endsAt: { gt: new Date() },
    },
  });
  return Boolean(membership);
}

export async function getCurrentUserAccess() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const isOwner = role === "OWNER" || role === "ADMIN";
  const member = isOwner || (await hasActiveMembership(userId));
  return {
    session,
    userId,
    role,
    isOwner,
    isMember: member,
  };
}

export function formatPrice(won: number) {
  return new Intl.NumberFormat("ko-KR").format(won) + "원";
}

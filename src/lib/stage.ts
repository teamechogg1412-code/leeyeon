import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getStage() {
  const stage = await prisma.stage.findFirst({
    where: { slug: "leeyeon" },
  });
  if (stage) return stage;

  const fallback = await prisma.stage.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!fallback) throw new Error("Stage not found. Run seed.");
  return fallback;
}

export async function hasActiveMembership(
  userId?: string | null,
  stageId?: string
) {
  if (!userId) return false;
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endsAt: { gt: new Date() },
      ...(stageId ? { plan: { stageId } } : {}),
    },
  });
  return Boolean(membership);
}

export async function getCurrentUserAccess() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const isOwner = role === "OWNER" || role === "ADMIN";
  const stage = await getStage();
  const member =
    isOwner || (await hasActiveMembership(userId, stage.id));
  return {
    session,
    userId,
    role,
    isOwner,
    isMember: member,
    stage,
  };
}

export { formatPrice } from "@/lib/format";

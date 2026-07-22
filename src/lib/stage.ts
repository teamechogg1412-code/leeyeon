import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const STAGE_COOKIE = "fanstage_slug";

export async function listStages() {
  return prisma.stage.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      heroUrl: true,
    },
  });
}

export async function getStage() {
  const jar = await cookies();
  const slug = jar.get(STAGE_COOKIE)?.value;
  if (slug) {
    const found = await prisma.stage.findUnique({ where: { slug } });
    if (found) return found;
  }

  const stage = await prisma.stage.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!stage) throw new Error("Stage not found. Run seed.");
  return stage;
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

import { prisma } from "@/lib/prisma";
import { getMembershipBadgeMap } from "@/lib/membership";

const authorSelect = {
  id: true,
  nickname: true,
  role: true,
  image: true,
} as const;

export async function fetchPopMessages(input: {
  roomId: string;
  stageId: string;
  afterCreatedAt?: Date;
  take?: number;
}) {
  const messages = await prisma.popMessage.findMany({
    where: input.afterCreatedAt
      ? {
          roomId: input.roomId,
          createdAt: { gt: input.afterCreatedAt },
        }
      : { roomId: input.roomId },
    orderBy: { createdAt: "asc" },
    take: input.take ?? 100,
    include: { author: { select: authorSelect } },
  });

  const badges = await getMembershipBadgeMap(
    messages.map((m) => m.author.id),
    input.stageId
  );

  return messages.map((m) => {
    const badge = badges.get(m.author.id);
    return {
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      author: {
        id: m.author.id,
        nickname: m.author.nickname,
        role: m.author.role,
        image: m.author.image,
        tierLabel: badge?.tierLabel ?? null,
        badgeColor: badge?.badgeColor ?? null,
      },
    };
  });
}

import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/webpush";

export type NotifyType =
  | "COMMENT"
  | "REACTION"
  | "MEMBERSHIP"
  | "ORDER"
  | "FROM"
  | "CONTENT"
  | "SCHEDULE"
  | "POP"
  | "SYSTEM";

export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  type?: NotifyType;
}) {
  if (!input.userId) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      type: input.type || "SYSTEM",
    },
  });

  void sendPushToUsers([input.userId], {
    title: input.title,
    body: input.body,
    href: input.href,
  });
}

/** Notify fans (and optionally members only). Caps at 200. */
export async function notifyFans(input: {
  title: string;
  body: string;
  href?: string;
  type?: NotifyType;
  excludeUserId?: string;
  membersOnly?: boolean;
}) {
  const users = input.membersOnly
    ? await prisma.user.findMany({
        where: {
          role: "FAN",
          id: input.excludeUserId ? { not: input.excludeUserId } : undefined,
          memberships: {
            some: { status: "ACTIVE", endsAt: { gt: new Date() } },
          },
        },
        select: { id: true },
        take: 200,
      })
    : await prisma.user.findMany({
        where: {
          role: { in: ["FAN"] },
          id: input.excludeUserId ? { not: input.excludeUserId } : undefined,
        },
        select: { id: true },
        take: 200,
      });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: input.title,
      body: input.body,
      href: input.href,
      type: input.type || "SYSTEM",
    })),
  });

  void sendPushToUsers(
    users.map((u) => u.id),
    {
      title: input.title,
      body: input.body,
      href: input.href,
    }
  );
}

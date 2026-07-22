import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

function configureWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:owner@fanstage.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; href?: string }
) {
  if (userIds.length === 0) return;
  if (!configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  if (subscriptions.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href || "/notifications",
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (error) {
        const status =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}

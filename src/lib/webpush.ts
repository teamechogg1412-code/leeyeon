import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/pushConfig";

export { isPushConfigured };

function configureWebPush(
  webpush: typeof import("web-push").default
) {
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
  if (!isPushConfigured()) return;

  const webpush = (await import("web-push")).default;
  if (!configureWebPush(webpush)) return;

  let subscriptions: Awaited<
    ReturnType<typeof prisma.pushSubscription.findMany>
  > = [];
  try {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });
  } catch {
    // Table may not exist yet if db push lagged — skip push quietly.
    return;
  }
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
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}

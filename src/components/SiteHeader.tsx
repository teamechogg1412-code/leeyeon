import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { getStage } from "@/lib/stage";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

export async function SiteHeader({ stageName }: { stageName: string }) {
  const session = await auth();
  const stage = await getStage();
  const isOwner =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  let unreadCount = 0;
  if (session?.user?.id) {
    unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
  }

  return (
    <SiteHeaderClient
      stageName={stageName}
      isLoggedIn={Boolean(session?.user)}
      isOwner={Boolean(isOwner)}
      shopEnabled={stage.shopEnabled}
      unreadCount={unreadCount}
      logoutAction={logoutAction}
    />
  );
}

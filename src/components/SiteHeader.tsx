import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { getStage, listStages } from "@/lib/stage";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

export async function SiteHeader({ stageName }: { stageName: string }) {
  const session = await auth();
  const isOwner =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const [stage, stages] = await Promise.all([getStage(), listStages()]);

  let unreadCount = 0;
  if (session?.user?.id) {
    unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
  }

  return (
    <SiteHeaderClient
      stageName={stageName || stage.name}
      stageSlug={stage.slug}
      stages={stages}
      isLoggedIn={Boolean(session?.user)}
      isOwner={Boolean(isOwner)}
      unreadCount={unreadCount}
      logoutAction={logoutAction}
    />
  );
}

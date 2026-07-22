import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

export async function SiteHeader({ stageName }: { stageName: string }) {
  const session = await auth();
  const isOwner =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <SiteHeaderClient
      stageName={stageName}
      isLoggedIn={Boolean(session?.user)}
      isOwner={Boolean(isOwner)}
      logoutAction={logoutAction}
    />
  );
}

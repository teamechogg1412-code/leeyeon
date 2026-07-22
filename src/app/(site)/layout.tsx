import { SiteHeader } from "@/components/SiteHeader";
import { getStage } from "@/lib/stage";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stage = await getStage();
  return (
    <>
      <SiteHeader stageName={stage.name} />
      <main className="flex-1 pb-16 pt-6">{children}</main>
    </>
  );
}

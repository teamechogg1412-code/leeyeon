import { redirect } from "next/navigation";
import { getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function CommunityIndexPage() {
  const stage = await getStage();
  const board = await prisma.board.findFirst({
    where: { stageId: stage.id },
    orderBy: { sortOrder: "asc" },
  });
  if (!board) redirect("/");
  redirect(`/community/board/${board.id}`);
}

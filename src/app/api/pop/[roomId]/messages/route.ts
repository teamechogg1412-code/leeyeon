import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPopMessages } from "@/lib/popMessages";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;
  const after = req.nextUrl.searchParams.get("after") || "";

  const room = await prisma.popRoom.findUnique({ where: { id: roomId } });
  if (!room) {
    return NextResponse.json({ messages: [] }, { status: 404 });
  }

  let afterCreatedAt: Date | undefined;
  if (after) {
    const anchor = await prisma.popMessage.findUnique({
      where: { id: after },
      select: { createdAt: true },
    });
    afterCreatedAt = anchor?.createdAt;
  }

  const messages = await fetchPopMessages({
    roomId,
    stageId: room.stageId,
    afterCreatedAt,
    take: after ? 50 : 100,
  });

  return NextResponse.json({ messages });
}

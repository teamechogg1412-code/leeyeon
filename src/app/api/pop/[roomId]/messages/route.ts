import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const messages = await prisma.popMessage.findMany({
    where: after
      ? {
          roomId,
          createdAt: {
            gt:
              (
                await prisma.popMessage.findUnique({
                  where: { id: after },
                  select: { createdAt: true },
                })
              )?.createdAt || new Date(0),
          },
        }
      : { roomId },
    orderBy: { createdAt: "asc" },
    take: after ? 50 : 100,
    include: {
      author: { select: { id: true, nickname: true, role: true } },
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      author: m.author,
    })),
  });
}

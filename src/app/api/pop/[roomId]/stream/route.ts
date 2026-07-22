import { prisma } from "@/lib/prisma";
import { fetchPopMessages } from "@/lib/popMessages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;
  const url = new URL(req.url);
  let afterId = url.searchParams.get("after") || "";

  const room = await prisma.popRoom.findUnique({ where: { id: roomId } });
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("ready", { roomId, at: new Date().toISOString() });

      const tick = async () => {
        if (closed) return;
        try {
          let afterCreatedAt: Date | undefined;
          if (afterId) {
            const anchor = await prisma.popMessage.findUnique({
              where: { id: afterId },
              select: { createdAt: true },
            });
            afterCreatedAt = anchor?.createdAt;
          }

          const messages = await fetchPopMessages({
            roomId,
            stageId: room.stageId,
            afterCreatedAt,
            take: 50,
          });

          if (messages.length) {
            send("messages", { messages });
            afterId = messages[messages.length - 1].id;
          } else {
            send("ping", { t: Date.now() });
          }
        } catch {
          send("error", { message: "stream tick failed" });
        }
      };

      await tick();
      const timer = setInterval(tick, 1200);

      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener("abort", abort);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function serializeMessage(m: {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; nickname: string; role: string };
}) {
  return {
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    author: m.author,
  };
}

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
          let afterAt: Date | null = null;
          if (afterId) {
            const anchor = await prisma.popMessage.findUnique({
              where: { id: afterId },
              select: { createdAt: true },
            });
            afterAt = anchor?.createdAt || null;
          }

          const messages = await prisma.popMessage.findMany({
            where: {
              roomId,
              ...(afterAt ? { createdAt: { gt: afterAt } } : {}),
            },
            orderBy: { createdAt: "asc" },
            take: 50,
            include: {
              author: { select: { id: true, nickname: true, role: true } },
            },
          });

          if (messages.length) {
            const payload = messages.map(serializeMessage);
            send("messages", { messages: payload });
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

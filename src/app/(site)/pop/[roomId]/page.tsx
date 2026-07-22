import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { PopChat } from "@/components/PopChat";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function PopRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const stage = await getStage();
  const { session, isMember, isOwner } = await getCurrentUserAccess();

  const room = await prisma.popRoom.findFirst({
    where: { id: roomId, stageId: stage.id },
  });
  if (!room) notFound();

  if (room.membershipRequired && !isMember && !isOwner) {
    redirect("/shop/membership");
  }

  const messages = await prisma.popMessage.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      author: { select: { id: true, nickname: true, role: true } },
    },
  });

  const canChat = Boolean(session?.user?.id);

  return (
    <div className="page-shell max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/pop" className="text-xs text-muted hover:text-black">
            ← POP
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{room.title}</h1>
            {room.live && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#c81e1e] px-2 py-0.5 text-[10px] font-semibold text-white">
                <Radio size={10} /> LIVE
              </span>
            )}
          </div>
          {room.description && (
            <p className="mt-1 text-sm text-muted">{room.description}</p>
          )}
        </div>
      </div>

      <PopChat
        roomId={room.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          author: m.author,
        }))}
        canChat={canChat}
        lockedReason={
          canChat ? undefined : "메시지를 보내려면 로그인하세요."
        }
      />
    </div>
  );
}

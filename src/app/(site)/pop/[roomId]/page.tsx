import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { PopChat } from "@/components/PopChat";
import { togglePopLiveAction } from "@/lib/actions";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { getActiveMembership } from "@/lib/membership";
import { fetchPopMessages } from "@/lib/popMessages";
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

  const messages = await fetchPopMessages({
    roomId: room.id,
    stageId: stage.id,
    take: 100,
  });

  const loggedIn = Boolean(session?.user?.id);
  const canChat = loggedIn && room.live;
  let lockedReason: string | undefined;
  if (!loggedIn) {
    lockedReason = "메시지를 보내려면 로그인하세요.";
  } else if (!room.live) {
    lockedReason = "라이브가 종료되어 채팅이 잠겼습니다. 대화 내용은 계속 볼 수 있어요.";
  }

  let currentUser: {
    id: string;
    nickname: string;
    role: string;
    image: string | null;
    tierLabel: string | null;
    badgeColor: string | null;
  } | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, nickname: true, role: true, image: true },
    });
    const membership = await getActiveMembership(session.user.id, stage.id);
    if (user) {
      currentUser = {
        ...user,
        tierLabel:
          membership?.plan.tierLabel || membership?.plan.name || null,
        badgeColor: membership?.plan.badgeColor || null,
      };
    }
  }

  return (
    <div className="page-shell max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/pop" className="text-xs text-muted hover:text-black">
            ← POP
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{room.title}</h1>
            {room.live ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#c81e1e] px-2 py-0.5 text-[10px] font-semibold text-white">
                <Radio size={10} /> LIVE
              </span>
            ) : (
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-muted">
                ENDED
              </span>
            )}
          </div>
          {room.description && (
            <p className="mt-1 text-sm text-muted">{room.description}</p>
          )}
        </div>

        {isOwner && (
          <form action={togglePopLiveAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="live" value={room.live ? "0" : "1"} />
            <button
              type="submit"
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                room.live
                  ? "border border-line text-muted hover:bg-black/5"
                  : "bg-black text-white"
              }`}
            >
              {room.live ? "라이브 종료" : "라이브 시작"}
            </button>
          </form>
        )}
      </div>

      <PopChat
        roomId={room.id}
        initialMessages={messages}
        canChat={canChat}
        currentUser={currentUser}
        lockedReason={lockedReason}
      />
    </div>
  );
}

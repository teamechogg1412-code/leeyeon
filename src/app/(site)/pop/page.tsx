import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Radio } from "lucide-react";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function PopPage() {
  const stage = await getStage();
  const { isMember } = await getCurrentUserAccess();
  const rooms = await prisma.popRoom.findMany({
    where: { stageId: stage.id },
    orderBy: [{ live: "desc" }, { startsAt: "desc" }],
    include: {
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="page-shell max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">POP</h1>
        <p className="mt-1 text-sm text-muted">
          {stage.name}과 실시간으로 소통하는 라이브 채팅
        </p>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => {
          const locked = room.membershipRequired && !isMember;
          return (
            <Link
              key={room.id}
              href={`/pop/${room.id}`}
              className="block rounded-2xl border border-line bg-surface p-4 transition hover:border-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {room.live ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#c81e1e] px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Radio size={10} /> LIVE
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-muted">
                        ENDED
                      </span>
                    )}
                    {room.membershipRequired && (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-muted">
                        Members
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-[16px] font-semibold">{room.title}</h2>
                  {room.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {room.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {format(room.startsAt, "M월 d일 HH:mm", { locale: ko })} ·
                    메시지 {room._count.messages}
                    {locked ? " · 멤버십 필요" : ""}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
        {rooms.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            진행 중인 POP이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

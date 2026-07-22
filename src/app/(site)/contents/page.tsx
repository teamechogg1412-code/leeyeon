import Link from "next/link";
import { Lock, MessageCircle, Play } from "lucide-react";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function ContentsPage() {
  const stage = await getStage();
  const { isMember } = await getCurrentUserAccess();
  const contents = await prisma.content.findMany({
    where: { stageId: stage.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { comments: true } },
    },
  });

  const grouped = contents.reduce<Record<string, typeof contents>>(
    (acc, item) => {
      const key = item.category || "OFFICIAL";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  const categories = Object.keys(grouped);

  return (
    <div className="page-shell space-y-10">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Contents</h1>
        <p className="mt-1 text-sm text-muted">공식 영상과 콘텐츠</p>
      </div>

      {categories.map((category) => (
        <section key={category}>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[17px] font-semibold">{category}</h2>
            <span className="text-xs text-muted">
              {grouped[category].length}개
            </span>
          </div>

          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {grouped[category].map((content) => {
              const locked = content.membershipRequired && !isMember;
              return (
                <Link
                  key={content.id}
                  href={
                    locked ? "/shop/membership" : `/contents/${content.id}`
                  }
                  className="group w-[240px] shrink-0 sm:w-[260px]"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1a1a1a]">
                    {content.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={content.coverUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#222] to-[#4a3030]" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                      <span className="rounded-full bg-black/55 p-2.5 text-white opacity-90">
                        {locked ? <Lock size={16} /> : <Play size={16} />}
                      </span>
                    </div>
                    {content.membershipRequired && (
                      <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                        Members
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 text-[14px] font-medium leading-snug">
                    {content.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] text-muted">
                    <MessageCircle size={12} />
                    {content._count.comments > 0
                      ? `댓글 ${content._count.comments}`
                      : content.body.slice(0, 28)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {contents.length === 0 && (
        <p className="py-20 text-center text-sm text-muted">
          등록된 콘텐츠가 없습니다.
        </p>
      )}
    </div>
  );
}

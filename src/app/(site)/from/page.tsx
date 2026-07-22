import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createStoryAction } from "@/lib/actions";
import { avatarColor, avatarInitial } from "@/lib/avatar";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function FromPage() {
  const stage = await getStage();
  const { isOwner } = await getCurrentUserAccess();
  const stories = await prisma.story.findMany({
    where: { stageId: stage.id },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  return (
    <div className="page-shell max-w-[640px]">
      <h1 className="text-[22px] font-semibold tracking-tight">From Yeon</h1>
      <p className="mt-1 text-sm text-muted">공식 메시지와 일상을 전합니다.</p>

      {isOwner && (
        <form
          action={createStoryAction}
          encType="multipart/form-data"
          className="mt-6 space-y-3 rounded-2xl border border-line bg-surface p-4"
        >
          <div className="flex gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: avatarColor("official") }}
            >
              Y
            </div>
            <textarea
              name="body"
              rows={3}
              placeholder="팬들에게 메시지를 남겨보세요"
              className="w-full resize-none rounded-xl border border-line bg-[#f7f7f7] px-3 py-2 text-sm outline-none focus:border-black/30 focus:bg-white"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-3 pl-[52px]">
            <input name="image" type="file" accept="image/*" className="text-xs" />
            <button
              type="submit"
              className="rounded-full bg-black px-4 py-2 text-sm text-white"
            >
              게시하기
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {stories.map((story) => (
          <article
            key={story.id}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: avatarColor(story.author.nickname) }}
              >
                {avatarInitial(story.author.nickname)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {story.author.nickname}
                  </span>
                  <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium">
                    Official
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {formatDistanceToNow(story.createdAt, {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
              {story.body}
            </p>
            {story.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.imageUrl}
                alt=""
                className="mt-4 max-h-[420px] w-full rounded-xl object-cover"
              />
            )}
          </article>
        ))}
        {stories.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            아직 메시지가 없습니다.
          </p>
        )}
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-muted">
        ← Home
      </Link>
    </div>
  );
}

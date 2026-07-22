import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createStoryAction } from "@/lib/actions";
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
    <div className="page-shell max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
        From Yeon
      </h1>
      <p className="mt-2 text-sm text-muted">
        공식 메시지와 일상을 전합니다.
      </p>

      {isOwner && (
        <form
          action={createStoryAction}
          encType="multipart/form-data"
          className="mt-8 space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <textarea
            name="body"
            rows={3}
            placeholder="팬들에게 메시지를 남겨보세요"
            className="w-full resize-none rounded-xl border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30"
            required
          />
          <input name="image" type="file" accept="image/*" className="text-sm" />
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            게시하기
          </button>
        </form>
      )}

      <div className="mt-8 space-y-4">
        {stories.map((story) => (
          <article
            key={story.id}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {story.body}
            </p>
            {story.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.imageUrl}
                alt=""
                className="mt-4 max-h-80 w-full rounded-xl object-cover"
              />
            )}
            <p className="mt-4 text-xs text-muted">
              {story.author.nickname} ·{" "}
              {format(story.createdAt, "yyyy.MM.dd HH:mm", { locale: ko })}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

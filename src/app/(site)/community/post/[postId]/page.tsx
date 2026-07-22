import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createCommentAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const session = await auth();
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      board: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: true },
      },
    },
  });
  if (!post) notFound();

  return (
    <div className="page-shell max-w-2xl">
      <Link
        href={`/community/board/${post.boardId}`}
        className="text-xs text-muted hover:text-black"
      >
        ← {post.board.name}
      </Link>

      <article className="mt-4 border-b border-line pb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {post.author.nickname} ·{" "}
          {format(post.createdAt, "yyyy.MM.dd HH:mm", { locale: ko })}
        </p>
        <div className="mt-6 whitespace-pre-wrap text-[15px] leading-7">
          {post.body}
        </div>
      </article>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">
          댓글 {post.comments.length}
        </h2>
        <div className="mt-4 space-y-4">
          {post.comments.map((comment) => (
            <div key={comment.id} className="border-b border-line pb-4">
              <p className="text-sm font-medium">{comment.author.nickname}</p>
              <p className="mt-1 text-sm leading-relaxed text-black/75">
                {comment.body}
              </p>
            </div>
          ))}
        </div>

        {session ? (
          <form action={createCommentAction} className="mt-6 space-y-3">
            <input type="hidden" name="postId" value={post.id} />
            <textarea
              name="body"
              rows={3}
              placeholder="댓글을 남겨보세요"
              className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-black/30"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-black px-4 py-2 text-sm text-white"
            >
              등록
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">
            댓글을 작성하려면{" "}
            <Link href="/login" className="underline">
              로그인
            </Link>
            이 필요합니다.
          </p>
        )}
      </section>
    </div>
  );
}

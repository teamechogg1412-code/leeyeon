import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Bookmark,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Share2,
  SmilePlus,
  ThumbsUp,
  Heart,
  Glasses,
} from "lucide-react";
import {
  createCommentAction,
  deleteCommentAction,
  deletePostAction,
  toggleReactionAction,
} from "@/lib/actions";
import { auth } from "@/lib/auth";
import { avatarColor, avatarInitial } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";

const REACTIONS = [
  { type: "like", label: "좋아요", Icon: ThumbsUp },
  { type: "love", label: "하트", Icon: Heart },
  { type: "cool", label: "멋져요", Icon: Glasses },
] as const;

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
      reactions: true,
    },
  });
  if (!post) notFound();

  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });
  const viewCount = post.viewCount + 1;

  const isOwnerRole =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const canDeletePost =
    session?.user?.id === post.authorId || Boolean(isOwnerRole);
  const isManager =
    post.author.role === "OWNER" || post.author.role === "ADMIN";

  const reactionCounts = Object.fromEntries(
    REACTIONS.map((r) => [
      r.type,
      post.reactions.filter((x) => x.type === r.type).length,
    ])
  ) as Record<(typeof REACTIONS)[number]["type"], number>;

  const myReactions = new Set(
    post.reactions
      .filter((r) => r.userId === session?.user?.id)
      .map((r) => r.type)
  );

  return (
    <div className="page-shell max-w-[720px]">
      <Link
        href={`/community/board/${post.boardId}`}
        className="inline-flex text-[15px] font-medium text-black/80 hover:underline"
      >
        {post.board.name}
      </Link>

      <article className="mt-5 rounded-2xl border border-line bg-surface px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: avatarColor(post.author.nickname) }}
            >
              {avatarInitial(post.author.nickname)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">
                  {post.author.nickname}
                </span>
                {isManager && (
                  <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-black/70">
                    Manager
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] text-muted">
                {format(post.createdAt, "yyyy.MM.dd HH:mm")} · 조회{" "}
                {viewCount.toLocaleString("ko-KR")}
              </p>
            </div>
          </div>

          {canDeletePost ? (
            <form action={deletePostAction}>
              <input type="hidden" name="postId" value={post.id} />
              <button
                type="submit"
                className="rounded-full p-2 text-muted hover:bg-black/5 hover:text-accent"
                title="삭제"
              >
                <MoreHorizontal size={18} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="rounded-full p-2 text-muted"
              aria-label="more"
            >
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>

        <h1 className="mt-6 text-[22px] font-semibold leading-snug tracking-tight sm:text-[26px]">
          {post.title}
        </h1>

        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="mt-6 w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-6 whitespace-pre-wrap text-[15px] leading-[1.75] text-black/85">
          {post.body}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          {REACTIONS.map(({ type, label, Icon }) => {
            const active = myReactions.has(type);
            const count = reactionCounts[type];
            return (
              <form key={type} action={toggleReactionAction}>
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="type" value={type} />
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-black/20 bg-black/[0.06] font-medium"
                      : "border-line bg-white text-black/70 hover:border-black/20"
                  }`}
                  aria-label={label}
                >
                  <Icon
                    size={15}
                    className={active ? "text-accent" : "opacity-70"}
                  />
                  {count > 0 && <span>{count}</span>}
                </button>
              </form>
            );
          })}

          <div className="ml-auto flex items-center gap-1 text-muted">
            <button
              type="button"
              className="rounded-full p-2 hover:bg-black/5"
              aria-label="share"
            >
              <Share2 size={16} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 hover:bg-black/5"
              aria-label="bookmark"
            >
              <Bookmark size={16} />
            </button>
            <span className="inline-flex items-center gap-1 px-2 text-sm">
              <MessageCircle size={15} />
              {post.comments.length}
            </span>
          </div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Comments{" "}
          <span className="text-black/50">{post.comments.length}</span>
        </h2>

        {session ? (
          <form
            action={createCommentAction}
            className="mt-4 rounded-2xl border border-line bg-surface p-4"
          >
            <input type="hidden" name="postId" value={post.id} />
            <div className="flex gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{
                  background: avatarColor(session.user.nickname || "me"),
                }}
              >
                {avatarInitial(session.user.nickname || "me")}
              </div>
              <textarea
                name="body"
                rows={3}
                placeholder="댓글을 남겨보세요"
                className="min-h-[72px] w-full resize-none rounded-xl border border-line bg-[#f7f7f7] px-3 py-2.5 text-sm outline-none focus:border-black/25 focus:bg-white"
                required
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-black px-4 py-2 text-sm text-white"
              >
                등록
              </button>
            </div>
          </form>
        ) : (
          <Link
            href="/login"
            className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-line bg-[#f3f3f3] px-4 py-4 text-sm text-muted hover:bg-[#ececec]"
          >
            <Lock size={15} />
            Please log in
          </Link>
        )}

        <div className="mt-2 divide-y divide-line">
          {post.comments.map((comment) => {
            const canDeleteComment =
              session?.user?.id === comment.authorId || Boolean(isOwnerRole);
            return (
              <div key={comment.id} className="flex gap-3 py-5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: avatarColor(comment.author.nickname) }}
                >
                  {avatarInitial(comment.author.nickname)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {comment.author.nickname}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDistanceToNow(comment.createdAt, {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                    {canDeleteComment && (
                      <form action={deleteCommentAction} className="ml-auto">
                        <input
                          type="hidden"
                          name="commentId"
                          value={comment.id}
                        />
                        <button
                          type="submit"
                          className="text-xs text-muted hover:text-accent"
                        >
                          삭제
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-black/80">
                    {comment.body}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 text-xs text-muted"
                  >
                    <SmilePlus size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

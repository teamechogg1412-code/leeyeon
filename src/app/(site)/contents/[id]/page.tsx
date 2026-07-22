import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Clapperboard,
  Flame,
  Glasses,
  Heart,
  Lock,
  PartyPopper,
  SmilePlus,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import {
  createContentCommentAction,
  deleteContentCommentAction,
  toggleContentReactionAction,
} from "@/lib/actions";
import { auth } from "@/lib/auth";
import { getYoutubeEmbedUrl, isDirectVideo } from "@/lib/media";
import { getMembershipBadgeMap } from "@/lib/membership";
import { getCurrentUserAccess } from "@/lib/stage";
import { UserAvatar } from "@/components/UserAvatar";
import { UserBadges } from "@/components/UserBadges";
import { prisma } from "@/lib/prisma";

const REACTIONS = [
  { type: "like", Icon: ThumbsUp },
  { type: "love", Icon: Heart },
  { type: "cool", Icon: Glasses },
  { type: "fire", Icon: Flame },
  { type: "clap", Icon: PartyPopper },
  { type: "wow", Icon: Sparkles },
] as const;

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const { isMember, isOwner: isOwnerRole, stage } =
    await getCurrentUserAccess();

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
      reactions: true,
    },
  });
  if (!content) notFound();

  const badgeMap = await getMembershipBadgeMap(
    content.comments.map((c) => c.authorId),
    content.stageId || stage.id
  );

  if (content.membershipRequired && !isMember) {
    return (
      <div className="page-shell max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold">멤버십 전용 콘텐츠</h1>
        <p className="mt-3 text-sm text-muted">
          이 콘텐츠는 멤버십 회원만 볼 수 있습니다.
        </p>
        <Link
          href="/shop/membership"
          className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm text-white"
        >
          멤버십 가입하기
        </Link>
      </div>
    );
  }

  await prisma.content.update({
    where: { id: content.id },
    data: { viewCount: { increment: 1 } },
  });

  const youtube = getYoutubeEmbedUrl(content.videoUrl);
  const direct = isDirectVideo(content.videoUrl);
  const reactionCounts = Object.fromEntries(
    REACTIONS.map((r) => [
      r.type,
      content.reactions.filter((x) => x.type === r.type).length,
    ])
  ) as Record<(typeof REACTIONS)[number]["type"], number>;
  const myReactions = new Set(
    content.reactions
      .filter((r) => r.userId === session?.user?.id)
      .map((r) => r.type)
  );

  return (
    <div className="page-shell !max-w-[1200px]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="min-w-0">
          <div className="overflow-hidden rounded-xl bg-black">
            {youtube ? (
              <div className="aspect-video w-full">
                <iframe
                  src={youtube}
                  title={content.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : direct && content.videoUrl ? (
              <video
                src={content.videoUrl}
                controls
                poster={content.coverUrl || undefined}
                className="aspect-video w-full bg-black"
              />
            ) : content.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.coverUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a1a1a] to-[#3a2a2a] text-white/70">
                <Clapperboard size={36} />
                <span className="text-sm">미디어 준비 중</span>
              </div>
            )}
          </div>

          <h1 className="mt-5 text-[22px] font-semibold leading-snug tracking-tight sm:text-[26px]">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            조회 {(content.viewCount + 1).toLocaleString("ko-KR")} ·{" "}
            {content.membershipRequired ? "Members" : "Free"}
          </p>

          <div className="mt-5 whitespace-pre-wrap text-[15px] leading-[1.75] text-black/85">
            {content.body}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            {REACTIONS.map(({ type, Icon }) => {
              const active = myReactions.has(type);
              const count = reactionCounts[type];
              return (
                <form key={type} action={toggleContentReactionAction}>
                  <input type="hidden" name="contentId" value={content.id} />
                  <input type="hidden" name="type" value={type} />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-black/20 bg-black/[0.06] font-medium"
                        : "border-line bg-white text-black/70 hover:border-black/20"
                    }`}
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
          </div>
        </section>

        <aside className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-line bg-[#f7f7f7] lg:sticky lg:top-20">
          <div className="border-b border-line bg-surface px-4 py-3">
            <h2 className="text-[15px] font-semibold">
              Comments{" "}
              <span className="text-black/45">{content.comments.length}</span>
            </h2>
          </div>

          <div className="border-b border-line bg-surface px-3 py-3">
            {session ? (
              <form action={createContentCommentAction} className="space-y-2">
                <input type="hidden" name="contentId" value={content.id} />
                <textarea
                  name="body"
                  rows={2}
                  placeholder="댓글을 남겨보세요"
                  className="w-full resize-none rounded-xl border border-line bg-[#f3f3f3] px-3 py-2 text-sm outline-none focus:border-black/25 focus:bg-white"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-black px-3 py-1.5 text-xs text-white"
                  >
                    등록
                  </button>
                </div>
              </form>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-[#ececec] px-3 py-3 text-sm text-muted"
              >
                <Lock size={14} />
                Please log in
              </Link>
            )}
          </div>

          <div className="flex-1 space-y-0 overflow-y-auto px-3">
            {content.comments.map((comment) => {
              const canDelete =
                session?.user?.id === comment.authorId || Boolean(isOwnerRole);
              const badge = badgeMap.get(comment.authorId);
              return (
                <div
                  key={comment.id}
                  className="flex gap-2.5 border-b border-black/5 py-3.5"
                >
                  <UserAvatar
                    nickname={comment.author.nickname}
                    image={comment.author.image}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-semibold">
                        {comment.author.nickname}
                      </span>
                      <UserBadges
                        role={comment.author.role}
                        tierLabel={badge?.tierLabel}
                        badgeColor={badge?.badgeColor}
                      />
                      <span className="text-[11px] text-muted">
                        {formatDistanceToNow(comment.createdAt, {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      {canDelete && (
                        <form
                          action={deleteContentCommentAction}
                          className="ml-auto"
                        >
                          <input
                            type="hidden"
                            name="commentId"
                            value={comment.id}
                          />
                          <button
                            type="submit"
                            className="text-[11px] text-muted hover:text-accent"
                          >
                            삭제
                          </button>
                        </form>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-black/80">
                      {comment.body}
                    </p>
                    <button
                      type="button"
                      className="mt-1.5 inline-flex items-center rounded-full border border-line bg-white px-1.5 py-0.5 text-muted"
                    >
                      <SmilePlus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            {content.comments.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">
                첫 댓글을 남겨보세요.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

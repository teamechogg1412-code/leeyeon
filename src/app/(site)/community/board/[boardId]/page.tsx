import Link from "next/link";
import { notFound } from "next/navigation";
import { List, Diamond, Lock } from "lucide-react";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const stage = await getStage();
  const { isMember, session } = await getCurrentUserAccess();

  const boards = await prisma.board.findMany({
    where: { stageId: stage.id },
    orderBy: { sortOrder: "asc" },
  });

  const board = boards.find((b) => b.id === boardId);
  if (!board) notFound();

  const locked = board.membershipRequired && !isMember;

  const posts = locked
    ? []
    : await prisma.post.findMany({
        where: { boardId: board.id },
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
          comments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { author: true },
          },
          _count: { select: { comments: true } },
        },
      });

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-52">
          <nav className="space-y-1">
            {boards.map((b) => {
              const active = b.id === board.id;
              const Icon = b.icon === "diamond" ? Diamond : List;
              return (
                <Link
                  key={b.id}
                  href={`/community/board/${b.id}`}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    active
                      ? "bg-black/[0.06] font-semibold text-black"
                      : "text-black/60 hover:bg-black/[0.03] hover:text-black"
                  }`}
                >
                  <Icon size={15} className="opacity-70" />
                  <span className="flex-1">{b.name}</span>
                  {b.membershipRequired && (
                    <Lock size={12} className="text-accent" />
                  )}
                  {active && <span className="text-accent">*</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <List size={18} className="opacity-50" />
              <h1 className="text-xl font-semibold tracking-tight">
                {board.name}
              </h1>
            </div>
            {session && !locked && (
              <Link
                href={`/community/write?boardId=${board.id}`}
                className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white"
              >
                글쓰기
              </Link>
            )}
          </div>

          {locked ? (
            <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
              <Lock className="mx-auto text-accent" size={22} />
              <h2 className="mt-4 text-lg font-semibold">멤버십 전용 게시판</h2>
              <p className="mt-2 text-sm text-muted">
                OFF-SHOT은 멤버십 회원만 이용할 수 있습니다.
              </p>
              <Link
                href="/shop/membership"
                className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm text-white"
              >
                멤버십 가입
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line border-y border-line">
              {posts.map((post) => {
                const latest = post.comments[0];
                return (
                  <Link
                    key={post.id}
                    href={`/community/post/${post.id}`}
                    className="block py-5 transition hover:bg-black/[0.015]"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <h2 className="text-[15px] font-semibold">{post.title}</h2>
                      {post._count.comments > 0 && (
                        <span className="text-sm font-medium text-accent">
                          [{post._count.comments}]
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted">
                      {post.author.nickname}
                    </p>
                    {latest && (
                      <p className="mt-1 line-clamp-1 text-[13px] text-black/45">
                        {latest.author.nickname} {latest.body}
                      </p>
                    )}
                  </Link>
                );
              })}
              {posts.length === 0 && (
                <p className="py-16 text-center text-sm text-muted">
                  아직 게시글이 없습니다.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

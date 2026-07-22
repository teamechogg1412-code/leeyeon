import Link from "next/link";
import { notFound } from "next/navigation";
import { List, Diamond, Lock } from "lucide-react";
import { FilterChips, SearchBar } from "@/components/SearchFilters";
import { buildQuery } from "@/lib/search";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;
type Sort = "new" | "comments" | "views";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}) {
  const { boardId } = await params;
  const {
    q = "",
    page: pageRaw = "1",
    sort: sortRaw = "new",
  } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const sort = (["new", "comments", "views"].includes(sortRaw)
    ? sortRaw
    : "new") as Sort;
  const stage = await getStage();
  const { isMember, session } = await getCurrentUserAccess();

  const boards = await prisma.board.findMany({
    where: { stageId: stage.id },
    orderBy: { sortOrder: "asc" },
  });

  const board = boards.find((b) => b.id === boardId);
  if (!board) notFound();

  const locked = board.membershipRequired && !isMember;
  const query = q.trim();

  const where: Prisma.PostWhereInput = {
    boardId: board.id,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { author: { nickname: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sort === "comments"
      ? [{ comments: { _count: "desc" } }, { createdAt: "desc" }]
      : sort === "views"
        ? [{ viewCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const [total, posts] = locked
    ? [0, []]
    : await Promise.all([
        prisma.post.count({ where }),
        prisma.post.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: {
            author: true,
            comments: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { author: true },
            },
            _count: { select: { comments: true } },
          },
        }),
      ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = { q: query, sort: sort === "new" ? "" : sort };

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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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

          {!locked && (
            <div className="mb-5 space-y-3">
              <SearchBar
                action={`/community/board/${board.id}`}
                q={query}
                placeholder="제목, 내용, 닉네임 검색"
                preserve={{ sort: sort === "new" ? "" : sort }}
              />
              <FilterChips
                items={[
                  {
                    label: "최신순",
                    href: `/community/board/${board.id}${buildQuery({ ...qs, sort: "" })}`,
                    active: sort === "new",
                  },
                  {
                    label: "댓글순",
                    href: `/community/board/${board.id}${buildQuery({ ...qs, sort: "comments" })}`,
                    active: sort === "comments",
                  },
                  {
                    label: "조회순",
                    href: `/community/board/${board.id}${buildQuery({ ...qs, sort: "views" })}`,
                    active: sort === "views",
                  },
                ]}
              />
              {query && (
                <p className="text-xs text-muted">
                  “{query}” 검색 결과 {total}개
                </p>
              )}
            </div>
          )}

          {locked ? (
            <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
              <Lock className="mx-auto text-accent" size={22} />
              <h2 className="mt-4 text-lg font-semibold">멤버십 전용 게시판</h2>
              <p className="mt-2 text-sm text-muted">
                멤버십 회원만 이용할 수 있습니다.
              </p>
              <Link
                href="/shop/membership"
                className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm text-white"
              >
                멤버십 가입
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-line border-y border-line">
                {posts.map((post) => {
                  const latest = post.comments[0];
                  return (
                    <Link
                      key={post.id}
                      href={`/community/post/${post.id}`}
                      className="flex gap-4 py-5 transition hover:bg-black/[0.015]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <h2 className="text-[15px] font-semibold">
                            {post.title}
                          </h2>
                          {post._count.comments > 0 && (
                            <span className="text-sm font-medium text-accent">
                              [{post._count.comments}]
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[13px] text-muted">
                          {post.author.nickname}
                          <span className="mx-1.5 text-black/20">·</span>
                          조회 {post.viewCount}
                        </p>
                        {latest && (
                          <p className="mt-1 line-clamp-1 text-[13px] text-black/45">
                            {latest.author.nickname} {latest.body}
                          </p>
                        )}
                      </div>
                      {post.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      )}
                    </Link>
                  );
                })}
                {posts.length === 0 && (
                  <p className="py-16 text-center text-sm text-muted">
                    {query
                      ? "검색 결과가 없습니다."
                      : "아직 게시글이 없습니다."}
                  </p>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                  {page > 1 && (
                    <Link
                      href={`/community/board/${board.id}${buildQuery({
                        ...qs,
                        page: String(page - 1),
                      })}`}
                      className="rounded-full border border-line px-3 py-1.5"
                    >
                      이전
                    </Link>
                  )}
                  <span className="text-muted">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/community/board/${board.id}${buildQuery({
                        ...qs,
                        page: String(page + 1),
                      })}`}
                      className="rounded-full border border-line px-3 py-1.5"
                    >
                      다음
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { SearchBar } from "@/components/SearchFilters";
import { getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: qRaw } = await searchParams;
  const q = (qRaw || "").trim();
  const stage = await getStage();

  const empty = !q;

  const [contents, posts, products, stories, events] = empty
    ? [[], [], [], [], []]
    : await Promise.all([
        prisma.content.findMany({
          where: {
            stageId: stage.id,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.post.findMany({
          where: {
            board: { stageId: stage.id },
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { board: true, author: true },
        }),
        prisma.product.findMany({
          where: {
            stageId: stage.id,
            active: true,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.story.findMany({
          where: {
            stageId: stage.id,
            body: { contains: q, mode: "insensitive" },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.scheduleEvent.findMany({
          where: {
            stageId: stage.id,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { startsAt: "asc" },
        }),
      ]);

  const total =
    contents.length +
    posts.length +
    products.length +
    stories.length +
    events.length;

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-muted">
          콘텐츠 · 커뮤니티 · 샵 · From · 일정을 한곳에서 검색
        </p>
      </div>

      <SearchBar action="/search" q={q} placeholder="검색어를 입력하세요" />

      {empty ? (
        <p className="py-16 text-center text-sm text-muted">
          검색어를 입력해 주세요.
        </p>
      ) : total === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          “{q}” 검색 결과가 없습니다.
        </p>
      ) : (
        <div className="space-y-8">
          <p className="text-xs text-muted">결과 {total}개</p>

          {contents.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Contents</h2>
                <Link
                  href={`/contents?q=${encodeURIComponent(q)}`}
                  className="text-xs text-muted hover:text-black"
                >
                  더보기
                </Link>
              </div>
              <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {contents.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contents/${c.id}`}
                    className="block px-4 py-3 text-sm hover:bg-black/[0.02]"
                  >
                    <p className="font-medium">{c.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{c.category}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Community</h2>
              <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/post/${p.id}`}
                    className="block px-4 py-3 text-sm hover:bg-black/[0.02]"
                  >
                    <p className="font-medium">{p.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {p.board.name} · {p.author.nickname}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Shop</h2>
                <Link
                  href={`/shop?q=${encodeURIComponent(q)}`}
                  className="text-xs text-muted hover:text-black"
                >
                  더보기
                </Link>
              </div>
              <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/products/${p.id}`}
                    className="block px-4 py-3 text-sm hover:bg-black/[0.02]"
                  >
                    <p className="font-medium">{p.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {stories.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">From</h2>
                <Link
                  href={`/from?q=${encodeURIComponent(q)}`}
                  className="text-xs text-muted hover:text-black"
                >
                  더보기
                </Link>
              </div>
              <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {stories.map((s) => (
                  <Link
                    key={s.id}
                    href="/from"
                    className="block px-4 py-3 text-sm hover:bg-black/[0.02]"
                  >
                    <p className="line-clamp-2">{s.body}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Schedule</h2>
                <Link
                  href={`/schedule?q=${encodeURIComponent(q)}`}
                  className="text-xs text-muted hover:text-black"
                >
                  더보기
                </Link>
              </div>
              <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {events.map((e) => (
                  <Link
                    key={e.id}
                    href="/schedule"
                    className="block px-4 py-3 text-sm hover:bg-black/[0.02]"
                  >
                    <p className="font-medium">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{e.category}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

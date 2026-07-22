import Link from "next/link";
import { getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const stage = await getStage();
  const [stories, contents, posts] = await Promise.all([
    prisma.story.findMany({
      where: { stageId: stage.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { author: true },
    }),
    prisma.content.findMany({
      where: { stageId: stage.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.post.findMany({
      where: { board: { stageId: stage.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        author: true,
        board: true,
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return (
    <div className="page-shell space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#101010] px-8 py-16 text-white sm:px-14 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #3a3a3a, transparent 50%), radial-gradient(ellipse at 80% 80%, #2a1a1a, transparent 45%)",
          }}
        />
        <div className="relative fade-up max-w-xl">
          <p className="mb-4 text-xs uppercase tracking-[0.28em] text-white/55">
            Official Platform
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            {stage.name}
          </h1>
          <p className="mt-5 max-w-md text-base text-white/70">
            {stage.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/community"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black"
            >
              Community
            </Link>
            <Link
              href="/shop/membership"
              className="rounded-full border border-white/25 px-5 py-2.5 text-sm text-white/90"
            >
              Membership
            </Link>
          </div>
        </div>
      </section>

      <section className="fade-up-delay grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold">From Yeon</h2>
            <Link href="/from" className="text-xs text-muted">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stories.map((story) => (
              <article
                key={story.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <p className="text-sm leading-relaxed">{story.body}</p>
                <p className="mt-3 text-xs text-muted">
                  {story.author.nickname}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-semibold">Contents</h2>
              <Link href="/contents" className="text-xs text-muted">
                View all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {contents.map((content) => (
                <Link
                  key={content.id}
                  href={`/contents/${content.id}`}
                  className="rounded-2xl border border-line bg-surface p-5 transition hover:border-black/20"
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted">
                    {content.membershipRequired ? "Members" : "Free"}
                  </p>
                  <h3 className="mt-2 font-medium">{content.title}</h3>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-semibold">Community</h2>
              <Link href="/community" className="text-xs text-muted">
                View all
              </Link>
            </div>
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/post/${post.id}`}
                  className="block px-5 py-4 transition hover:bg-black/[0.02]"
                >
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-medium">{post.title}</h3>
                    {post._count.comments > 0 && (
                      <span className="text-sm text-accent">
                        [{post._count.comments}]
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {post.board.name} · {post.author.nickname}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

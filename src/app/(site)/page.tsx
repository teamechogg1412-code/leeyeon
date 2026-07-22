import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { auth } from "@/lib/auth";
import { avatarColor, avatarInitial } from "@/lib/avatar";
import { getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

const DEFAULT_HERO = "/brand/leeyeon-hero.jpg";

export default async function HomePage() {
  const session = await auth();
  const stage = await getStage();
  const heroSrc =
    stage.heroUrl && !stage.heroUrl.startsWith("/uploads/")
      ? stage.heroUrl
      : DEFAULT_HERO;
  const [stories, contents, posts, products] = await Promise.all([
    prisma.story.findMany({
      where: { stageId: stage.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { author: true },
    }),
    prisma.content.findMany({
      where: { stageId: stage.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.post.findMany({
      where: { board: { stageId: stage.id } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        author: true,
        board: true,
        _count: { select: { comments: true } },
      },
    }),
    prisma.product.findMany({
      where: { stageId: stage.id, active: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const noticeColors = [
    "linear-gradient(145deg, #1f3d2f, #4f8a68)",
    "linear-gradient(145deg, #8b5a4a, #d4a08c)",
    "linear-gradient(145deg, #6b3d55, #c98aa8)",
    "linear-gradient(145deg, #2f4a4a, #6fa3a0)",
  ];

  return (
    <div className="pb-8">
      {/* Full-bleed magazine hero — nainwoo-style */}
      <section className="hero-bleed relative isolate min-h-[min(100svh,920px)] overflow-hidden bg-[#1a1c1e] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-[center_18%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

        {/* Oversized brand watermark */}
        <div className="pointer-events-none absolute inset-x-0 top-[9%] z-[1] px-3 text-center sm:top-[7%]">
          <p className="hero-brand-title mx-auto select-none font-[family-name:var(--font-display)] text-[clamp(5rem,18vw,12.5rem)] leading-[0.82] tracking-[-0.045em] text-black/[0.55] mix-blend-multiply drop-shadow-[0_2px_0_rgba(255,255,255,.08)]">
            YEON
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.42em] text-white/55 sm:text-[11px]">
            {stage.name} Official Membership
          </p>
        </div>

        {/* Bottom brand + CTAs */}
        <div className="relative z-[2] flex min-h-[min(100svh,920px)] flex-col justify-end px-4 pb-12 pt-32 sm:pb-16">
          <div className="fade-up mx-auto w-full max-w-3xl text-center">
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,7.5vw,5rem)] font-medium tracking-[-0.03em] text-white drop-shadow-[0_10px_40px_rgba(0,0,0,.55)]">
              LEE YEON
            </h1>
            <p className="mt-3 text-sm text-white/70 sm:text-[15px]">
              {stage.tagline || "Official Fan Community"}
            </p>
          </div>

          <div className="fade-up-delay mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {!session && (
              <Link
                href="/login"
                className="rounded-full bg-white/18 px-5 py-2.5 text-[12px] font-medium tracking-wide text-white backdrop-blur-md transition hover:bg-white/28"
              >
                LOGIN
              </Link>
            )}
            <Link
              href="/shop/membership"
              className="rounded-full bg-[#2f4a3c] px-5 py-2.5 text-[12px] font-medium tracking-wide text-white transition hover:bg-[#3a5c4a]"
            >
              MEMBERSHIP
            </Link>
            <Link
              href="/community"
              className="rounded-full bg-black/50 px-5 py-2.5 text-[12px] font-medium tracking-wide text-white backdrop-blur-md transition hover:bg-black/65"
            >
              COMMUNITY
            </Link>
            <Link
              href="/shop"
              className="rounded-full bg-[#c8d6cb] px-5 py-2.5 text-[12px] font-medium tracking-wide text-[#1a2a20] transition hover:bg-[#d7e4d9]"
            >
              SHOP
            </Link>
          </div>
        </div>
      </section>

      <div className="page-shell space-y-16 pt-10">
        {/* From stories — vertical cards */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[17px] font-semibold">From Yeon</h2>
            <Link
              href="/from"
              className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-black"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {stories.map((story, i) => (
              <Link
                key={story.id}
                href="/from"
                className="group relative h-[280px] w-[168px] shrink-0 overflow-hidden rounded-2xl sm:h-[320px] sm:w-[190px]"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: story.imageUrl
                      ? undefined
                      : `linear-gradient(160deg, ${["#2a3a45", "#3a2a35", "#2a352a", "#352a2a"][i % 4]}, #111)`,
                    backgroundImage: story.imageUrl
                      ? `linear-gradient(to top, rgba(0,0,0,.75), transparent 45%), url(${story.imageUrl})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-white/80"
                      style={{ background: avatarColor(story.author.nickname) }}
                    >
                      {avatarInitial(story.author.nickname)}
                    </div>
                    <span className="text-[11px] font-medium">
                      {story.author.nickname}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-[12px] leading-snug text-white/90">
                    {story.body}
                  </p>
                </div>
              </Link>
            ))}
            {stories.length === 0 && (
              <p className="py-10 text-sm text-muted">아직 스토리가 없습니다.</p>
            )}
          </div>
        </section>

        {/* Notice-style cards */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[17px] font-semibold">Notice</h2>
            <Link
              href="/community"
              className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-black"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={`/community/post/${post.id}`}
                className="group overflow-hidden rounded-2xl bg-surface"
              >
                <div
                  className="relative flex aspect-[4/3] items-end overflow-hidden p-4 text-white"
                  style={{
                    background: post.imageUrl
                      ? undefined
                      : noticeColors[i % noticeColors.length],
                    backgroundImage: post.imageUrl
                      ? `linear-gradient(to top, rgba(0,0,0,.55), transparent 50%), url(${post.imageUrl})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <p className="line-clamp-3 text-[15px] font-semibold leading-snug">
                    {post.title}
                  </p>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {post.board.name} · {post.author.nickname}
                    {post._count.comments > 0
                      ? ` · 댓글 ${post._count.comments}`
                      : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Contents mosaic */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[17px] font-semibold">Contents</h2>
            <Link
              href="/contents"
              className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-black"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {contents.map((content) => (
              <Link
                key={content.id}
                href={`/contents/${content.id}`}
                className="group overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
                  {content.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={content.coverUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#2a2a2a] to-[#4a3038]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                    <Play size={16} />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <p className="text-[10px] uppercase tracking-wider text-white/60">
                      {content.membershipRequired ? "Members" : "Free"}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug">
                      {content.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Shop strip */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[17px] font-semibold">Shop</h2>
            <Link
              href="/shop"
              className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-black"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/products/${product.id}`}
                className="group"
              >
                <div className="aspect-square overflow-hidden rounded-2xl bg-[#f0eeea]">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-[#ece7e1] to-[#d8cfc4]" />
                  )}
                </div>
                <h3 className="mt-2.5 line-clamp-2 text-[13px] leading-snug">
                  {product.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Lock, MessageCircle, Play } from "lucide-react";
import { FilterChips, SearchBar } from "@/components/SearchFilters";
import { SmartImage } from "@/components/SmartImage";
import { buildQuery } from "@/lib/search";
import { getStardomEditorials } from "@/lib/stardom";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Access = "all" | "free" | "members";
type Sort = "new" | "popular";

export default async function ContentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    access?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const category = (sp.category || "").trim();
  const access = (["all", "free", "members"].includes(sp.access || "")
    ? sp.access
    : "all") as Access;
  const sort = (["new", "popular"].includes(sp.sort || "")
    ? sp.sort
    : "new") as Sort;

  const stage = await getStage();
  const { isMember } = await getCurrentUserAccess();

  const where: Prisma.ContentWhereInput = {
    stageId: stage.id,
    ...(category && category !== "LOOKBOOK" ? { category } : {}),
    ...(access === "free" ? { membershipRequired: false } : {}),
    ...(access === "members" ? { membershipRequired: true } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const wantEditorials = !category || category === "LOOKBOOK";
  const wantContents = category !== "LOOKBOOK";

  const contents = wantContents
    ? await prisma.content.findMany({
        where,
        orderBy:
          sort === "popular"
            ? [{ viewCount: "desc" }, { createdAt: "desc" }]
            : { createdAt: "desc" },
        include: {
          _count: { select: { comments: true } },
        },
      })
    : [];

  const allCategories = await prisma.content.findMany({
    where: { stageId: stage.id },
    select: { category: true },
    distinct: ["category"],
  });

  const editorials = wantEditorials ? await getStardomEditorials() : [];

  const categories = allCategories
    .map((c) => c.category || "OFFICIAL")
    .filter(Boolean);

  const qLower = q.toLowerCase();
  const filteredEditorials =
    access === "members"
      ? []
      : editorials
          .map((ed) => ({
            ...ed,
            editorial_media: (ed.editorial_media || []).filter(
              (m) => !m.media_type || m.media_type === "image"
            ),
          }))
          .filter((ed) => {
            if (ed.editorial_media.length === 0) return false;
            if (!q) return true;
            const hay =
              `${ed.media_name || ""} ${ed.year_label || ""}`.toLowerCase();
            return hay.includes(qLower);
          });

  const showEditorials = wantEditorials && filteredEditorials.length > 0;

  const filterCategories = categories.includes("LOOKBOOK")
    ? categories
    : [...categories, "LOOKBOOK"];

  const base = { q, category, access, sort };

  return (
    <div className="page-shell space-y-8">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Contents</h1>
        <p className="mt-1 text-sm text-muted">공식 영상 · 화보 · 콘텐츠</p>
      </div>

      <SearchBar
        action="/contents"
        q={q}
        placeholder="제목 · 내용 · 카테고리 검색"
        preserve={{
          category,
          access: access === "all" ? "" : access,
          sort: sort === "new" ? "" : sort,
        }}
      />

      <div className="space-y-3">
        <FilterChips
          items={[
            {
              label: "전체",
              href: `/contents${buildQuery({ ...base, category: "" })}`,
              active: !category,
            },
            ...filterCategories.map((c) => ({
              label: c === "LOOKBOOK" ? "화보" : c,
              href: `/contents${buildQuery({ ...base, category: c })}`,
              active: category === c,
            })),
          ]}
        />
        <FilterChips
          items={[
            {
              label: "전체 공개",
              href: `/contents${buildQuery({ ...base, access: "all" })}`,
              active: access === "all",
            },
            {
              label: "무료",
              href: `/contents${buildQuery({ ...base, access: "free" })}`,
              active: access === "free",
            },
            {
              label: "멤버십",
              href: `/contents${buildQuery({ ...base, access: "members" })}`,
              active: access === "members",
            },
          ]}
        />
        <FilterChips
          items={[
            {
              label: "최신순",
              href: `/contents${buildQuery({ ...base, sort: "new" })}`,
              active: sort === "new",
            },
            {
              label: "인기순",
              href: `/contents${buildQuery({ ...base, sort: "popular" })}`,
              active: sort === "popular",
            },
          ]}
        />
      </div>

      {showEditorials && (
        <section className="space-y-4">
          <div>
            <h2 className="text-[17px] font-semibold">화보</h2>
            <p className="mt-1 text-sm text-muted">Editorials · 아카이브</p>
          </div>
          <div className="space-y-8">
            {filteredEditorials.map((ed) => (
              <div key={ed.id}>
                <div className="mb-3 flex flex-wrap items-baseline gap-2">
                  {ed.year_label && (
                    <span className="text-xs font-medium tracking-wide text-muted">
                      {ed.year_label}
                    </span>
                  )}
                  <h3 className="text-sm font-medium">
                    {ed.media_name || "Editorial"}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {ed.editorial_media.map((m) => (
                    <div
                      key={m.id}
                      className="overflow-hidden rounded-xl bg-[#1a1a1a]"
                    >
                      <SmartImage
                        src={m.media_url}
                        alt={ed.media_name || "editorial"}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {category !== "LOOKBOOK" && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            {showEditorials && (
              <h2 className="text-[17px] font-semibold">영상 · 콘텐츠</h2>
            )}
            <p className="ml-auto text-xs text-muted">결과 {contents.length}개</p>
          </div>

          {contents.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted">
              {q || category || access !== "all"
                ? "검색 결과가 없습니다."
                : "등록된 콘텐츠가 없습니다."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {contents.map((content) => {
                const locked = content.membershipRequired && !isMember;
                return (
                  <Link
                    key={content.id}
                    href={
                      locked ? "/shop/membership" : `/contents/${content.id}`
                    }
                    className="group"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1a1a1a]">
                      {content.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={content.coverUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#222] to-[#4a3030]" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                        <span className="rounded-full bg-black/55 p-2.5 text-white opacity-90">
                          {locked ? <Lock size={16} /> : <Play size={16} />}
                        </span>
                      </div>
                      {content.membershipRequired && (
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          Members
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">
                        {content.category}
                      </span>
                    </div>
                    <h3 className="mt-2.5 line-clamp-2 text-[14px] font-medium leading-snug">
                      {content.title}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1 text-[12px] text-muted">
                      <MessageCircle size={12} />
                      {content._count.comments > 0
                        ? `댓글 ${content._count.comments}`
                        : `조회 ${content.viewCount}`}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {category === "LOOKBOOK" && filteredEditorials.length === 0 && (
        <p className="py-20 text-center text-sm text-muted">
          {q ? "검색 결과가 없습니다." : "등록된 화보가 없습니다."}
        </p>
      )}
    </div>
  );
}

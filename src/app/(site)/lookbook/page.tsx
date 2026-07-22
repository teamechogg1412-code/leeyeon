import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { getStardomPortfolio } from "@/lib/stardom";
import { isSupabaseConfigured } from "@/lib/supabase";
import { resolveImageUrlForDisplay } from "@/lib/imageUrl";

export const dynamic = "force-dynamic";

export default async function LookbookPage() {
  const portfolio = await getStardomPortfolio();
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="page-shell max-w-4xl">
        <h1 className="text-[22px] font-semibold tracking-tight">Lookbook</h1>
        <p className="mt-3 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
          Supabase 연동이 필요합니다. Vercel/로컬 env에
          `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣으면
          Stardom Forge 화보·프로필이 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="page-shell max-w-4xl">
        <h1 className="text-[22px] font-semibold tracking-tight">Lookbook</h1>
        <p className="mt-3 text-sm text-muted">
          Stardom에서 배우 데이터(`Lee-Yeon`)를 찾지 못했습니다. 공개(RLS) 설정과
          slug를 확인해 주세요.
        </p>
      </div>
    );
  }

  const { actor, images, editorials } = portfolio;
  const hero =
    resolveImageUrlForDisplay(actor.profile_image_url) ||
    resolveImageUrlForDisplay(images[0]?.image_url);

  const gallery = [
    ...images.map((img) => ({
      id: img.id,
      url: img.image_url,
      label: "Profile",
    })),
    ...editorials.flatMap((ed) =>
      (ed.editorial_media || [])
        .filter((m) => !m.media_type || m.media_type === "image")
        .map((m) => ({
          id: m.id,
          url: m.media_url,
          label: [ed.year_label, ed.media_name].filter(Boolean).join(" · "),
        }))
    ),
  ];

  return (
    <div className="page-shell max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Portfolio
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {actor.name_ko}
            {actor.name_en ? (
              <span className="ml-2 text-lg font-normal text-muted">
                {actor.name_en}
              </span>
            ) : null}
          </h1>
          {actor.bio_headline && (
            <p className="mt-2 max-w-2xl text-sm text-muted">{actor.bio_headline}</p>
          )}
        </div>
        <Link
          href="/contents"
          className="text-sm text-muted transition hover:text-black"
        >
          Contents →
        </Link>
      </div>

      <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-2xl bg-black/5">
          <SmartImage
            src={hero || actor.profile_image_url}
            alt={actor.name_ko}
            className="aspect-[3/4] w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center space-y-4">
          {actor.bio_text && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/80">
              {actor.bio_text}
            </p>
          )}
          <dl className="grid gap-2 text-sm">
            {actor.height && (
              <div className="flex gap-3 border-b border-line py-2">
                <dt className="w-24 text-muted">Height</dt>
                <dd>{actor.height}</dd>
              </div>
            )}
            {actor.brand_keyword && (
              <div className="flex gap-3 border-b border-line py-2">
                <dt className="w-24 text-muted">Keyword</dt>
                <dd>{actor.brand_keyword}</dd>
              </div>
            )}
            {actor.instagram_id && (
              <div className="flex gap-3 border-b border-line py-2">
                <dt className="w-24 text-muted">Instagram</dt>
                <dd>
                  <a
                    href={`https://instagram.com/${actor.instagram_id.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    @{actor.instagram_id.replace(/^@/, "")}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <p className="text-[11px] text-muted">
            데이터 출처: Stardom Forge · slug `{actor.slug}` — 스타덤에서
            수정하면 여기에 반영됩니다.
          </p>
        </div>
      </section>

      {editorials.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Editorials</h2>
          <p className="mt-1 text-sm text-muted">화보 · 아카이브</p>
          <div className="mt-5 space-y-10">
            {editorials.map((ed) => {
              const media = (ed.editorial_media || []).filter(
                (m) => !m.media_type || m.media_type === "image"
              );
              if (media.length === 0) return null;
              return (
                <div key={ed.id}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-2">
                    {ed.year_label && (
                      <span className="text-xs font-medium tracking-wide text-muted">
                        {ed.year_label}
                      </span>
                    )}
                    <h3 className="font-medium">
                      {ed.media_name || "Editorial"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {media.map((m) => (
                      <div
                        key={m.id}
                        className="overflow-hidden rounded-xl bg-black/5"
                      >
                        <SmartImage
                          src={m.media_url}
                          alt={ed.media_name || "editorial"}
                          className="aspect-[3/4] w-full object-cover transition duration-500 hover:scale-[1.02]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {gallery.length > 0 && editorials.length === 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Gallery</h2>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {gallery.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl bg-black/5">
                <SmartImage
                  src={item.url}
                  alt={item.label || actor.name_ko}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

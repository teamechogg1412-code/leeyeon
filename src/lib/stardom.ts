import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const STARDOM_ACTOR_SLUG =
  process.env.STARDOM_ACTOR_SLUG || "Lee-Yeon";

export type StardomActor = {
  id: string;
  name_ko: string;
  name_en: string | null;
  slug: string;
  profile_image_url: string | null;
  bio_headline: string | null;
  bio_text: string | null;
  height: string | null;
  brand_keyword: string | null;
  instagram_id: string | null;
  is_published: boolean;
};

export type StardomActorImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

export type StardomEditorialMedia = {
  id: string;
  media_url: string;
  media_type: string;
  sort_order: number;
};

export type StardomEditorial = {
  id: string;
  year_label: string | null;
  media_name: string | null;
  sort_order: number;
  editorial_media: StardomEditorialMedia[];
};

export type StardomPortfolio = {
  actor: StardomActor;
  images: StardomActorImage[];
  editorials: StardomEditorial[];
};

export async function getStardomPortfolio(
  slug = STARDOM_ACTOR_SLUG
): Promise<StardomPortfolio | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  // Exact slug first, then case-insensitive match
  const exact = await supabase
    .from("actors")
    .select(
      "id, name_ko, name_en, slug, profile_image_url, bio_headline, bio_text, height, brand_keyword, instagram_id, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  let actor = (exact.data as StardomActor | null) ?? null;

  if (!actor) {
    const fuzzy = await supabase
      .from("actors")
      .select(
        "id, name_ko, name_en, slug, profile_image_url, bio_headline, bio_text, height, brand_keyword, instagram_id, is_published"
      )
      .ilike("slug", slug)
      .limit(1)
      .maybeSingle();
    actor = (fuzzy.data as StardomActor | null) ?? null;
    if (fuzzy.error) {
      console.error("[stardom] actor fetch failed", fuzzy.error.message);
    } else if (exact.error) {
      console.error("[stardom] actor fetch failed", exact.error.message);
    }
  }

  if (!actor) return null;

  const [imagesRes, editorialsRes] = await Promise.all([
    supabase
      .from("actor_images")
      .select("id, image_url, sort_order")
      .eq("actor_id", actor.id)
      .order("sort_order"),
    supabase
      .from("editorials")
      .select(
        "id, year_label, media_name, sort_order, editorial_media(id, media_url, media_type, sort_order)"
      )
      .eq("actor_id", actor.id)
      .order("sort_order"),
  ]);

  const editorials = (editorialsRes.data || []).map((ed) => {
    const media = Array.isArray(ed.editorial_media)
      ? [...ed.editorial_media].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
      : [];
    return { ...ed, editorial_media: media };
  }) as StardomEditorial[];

  return {
    actor: actor as StardomActor,
    images: (imagesRes.data || []) as StardomActorImage[],
    editorials,
  };
}

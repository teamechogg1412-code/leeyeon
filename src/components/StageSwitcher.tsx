"use client";

import { useTransition } from "react";
import { ChevronsUpDown } from "lucide-react";
import { switchStageAction } from "@/lib/actions";

type StageOption = {
  id: string;
  name: string;
  slug: string;
};

export function StageSwitcher({
  stages,
  currentSlug,
  isHome,
}: {
  stages: StageOption[];
  currentSlug: string;
  isHome: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (stages.length <= 1) return null;

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await switchStageAction(fd);
        });
      }}
      className="relative"
    >
      <select
        name="slug"
        defaultValue={currentSlug}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={pending}
        className={
          isHome
            ? "max-w-[9.5rem] appearance-none truncate rounded-full border border-white/25 bg-white/10 py-1.5 pl-3 pr-7 text-xs font-medium text-white outline-none backdrop-blur-md"
            : "max-w-[9.5rem] appearance-none truncate rounded-full border border-black/10 bg-white py-1.5 pl-3 pr-7 text-xs font-medium outline-none"
        }
        aria-label="Switch stage"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.slug} className="text-black">
            {s.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown
        size={12}
        className={
          isHome
            ? "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/70"
            : "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-black/40"
        }
      />
    </form>
  );
}

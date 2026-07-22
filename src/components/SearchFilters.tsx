import Link from "next/link";
import { Search } from "lucide-react";

export function SearchBar({
  action,
  q = "",
  placeholder = "검색",
  preserve = {},
}: {
  action: string;
  q?: string;
  placeholder?: string;
  preserve?: Record<string, string>;
}) {
  return (
    <form action={action} className="w-full">
      {Object.entries(preserve).map(([key, value]) =>
        value ? (
          <input key={key} type="hidden" name={key} value={value} />
        ) : null
      )}
      <label className="relative block">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black/30"
        />
      </label>
    </form>
  );
}

export function FilterChips({
  items,
}: {
  items: { href: string; label: string; active?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={`${item.label}-${item.href}`}
          href={item.href}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            item.active
              ? "border-black bg-black text-white"
              : "border-line bg-surface text-black/60 hover:border-black/25 hover:text-black"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

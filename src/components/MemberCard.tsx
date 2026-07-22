export function MemberCard({
  stageName,
  nickname,
  planName,
  tierLabel,
  badgeColor,
  endsAt,
}: {
  stageName: string;
  nickname: string;
  planName: string;
  tierLabel?: string | null;
  badgeColor?: string | null;
  endsAt: Date | string;
}) {
  const end =
    typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const accent = badgeColor || "#444";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#111] p-7 text-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${accent}, transparent 42%)`,
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">
            Digital Member Card
          </p>
          {tierLabel && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ background: accent }}
            >
              {tierLabel}
            </span>
          )}
        </div>
        <p className="mt-5 font-[family-name:var(--font-display)] text-4xl">
          {stageName}
        </p>
        <p className="mt-3 text-sm text-white/70">{nickname}</p>
        <div className="mt-8 flex items-end justify-between gap-4">
          <p className="text-sm text-white/80">{planName}</p>
          <p className="text-xs text-white/45">
            ~ {end.toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>
    </div>
  );
}

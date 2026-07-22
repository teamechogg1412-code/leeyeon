export function UserBadges({
  role,
  tierLabel,
  badgeColor,
}: {
  role?: string | null;
  tierLabel?: string | null;
  badgeColor?: string | null;
}) {
  const isOfficial = role === "OWNER" || role === "ADMIN";

  return (
    <>
      {isOfficial && (
        <span className="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-medium text-white">
          Official
        </span>
      )}
      {!isOfficial && tierLabel && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
          style={{ background: badgeColor || "#1a1a1a" }}
        >
          {tierLabel}
        </span>
      )}
    </>
  );
}

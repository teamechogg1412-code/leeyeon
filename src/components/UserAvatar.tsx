import { avatarColor, avatarInitial } from "@/lib/avatar";

export function UserAvatar({
  nickname,
  image,
  size = 40,
}: {
  nickname: string;
  image?: string | null;
  size?: number;
}) {
  const px = `${size}px`;
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: px,
        height: px,
        fontSize: Math.max(11, Math.round(size * 0.32)),
        background: avatarColor(nickname),
      }}
    >
      {avatarInitial(nickname)}
    </div>
  );
}

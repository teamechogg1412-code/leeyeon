const COLORS = [
  "#7c6cf0",
  "#2aa8a0",
  "#e07a5f",
  "#3d5a80",
  "#9b5de5",
  "#00bbf9",
  "#f15bb5",
  "#00f5d4",
];

export function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function avatarInitial(name: string) {
  return (name || "?").slice(0, 1).toUpperCase();
}

export function createOrderCode(prefix = "ord") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isTossEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY && process.env.TOSS_SECRET_KEY
  );
}

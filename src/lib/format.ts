export function formatPrice(won: number) {
  return "₩" + new Intl.NumberFormat("ko-KR").format(won);
}

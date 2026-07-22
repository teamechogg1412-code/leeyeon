export const FULFILLMENT_LABELS: Record<string, string> = {
  NONE: "해당 없음",
  READY: "배송 대기",
  PREPARING: "상품 준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송 완료",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  CANCELLED: "취소",
  REFUNDED: "환불",
};

export function fulfillmentTone(status: string) {
  switch (status) {
    case "READY":
      return "bg-[#f4f0e8] text-[#6b5535]";
    case "PREPARING":
      return "bg-[#eef2f7] text-[#3a4550]";
    case "SHIPPED":
      return "bg-[#eef6f4] text-[#2f4a3c]";
    case "DELIVERED":
      return "bg-black text-white";
    default:
      return "bg-black/5 text-black/55";
  }
}

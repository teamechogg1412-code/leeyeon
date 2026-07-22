import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

export async function fulfillPaidOrder(orderId: string, paymentKey?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID") return order;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paymentKey: paymentKey || order.paymentKey,
    },
  });

  if (order.type === "MEMBERSHIP") {
    const planId = order.items[0]?.planId;
    if (planId) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId },
      });
      if (plan) {
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + plan.durationDays);
        await prisma.membership.updateMany({
          where: { userId: order.userId, status: "ACTIVE" },
          data: { status: "CANCELLED" },
        });
        await prisma.membership.create({
          data: {
            userId: order.userId,
            planId: plan.id,
            status: "ACTIVE",
            endsAt,
          },
        });
        await notifyUser({
          userId: order.userId,
          title: "멤버십 가입 완료",
          body: `${plan.name} 멤버십이 활성화되었습니다.`,
          href: "/shop/membership",
          type: "MEMBERSHIP",
        });
      }
    }
  }

  if (order.type === "PRODUCT") {
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
    await notifyUser({
      userId: order.userId,
      title: "주문 완료",
      body: `${order.items[0]?.title || "상품"} 주문이 완료되었습니다.`,
      href: `/shop/orders/${order.id}`,
      type: "ORDER",
    });
  }

  return order;
}

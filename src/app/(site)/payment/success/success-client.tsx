"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmTossPaymentAction } from "@/lib/actions";

export default function PaymentSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("결제 승인 중...");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = Number(searchParams.get("amount") || 0);
    const oid = searchParams.get("oid");

    async function run() {
      if (!paymentKey || !orderId || !amount) {
        setMessage("결제 정보가 올바르지 않습니다.");
        return;
      }
      const result = await confirmTossPaymentAction({
        paymentKey,
        orderId: oid || orderId,
        amount,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      router.replace(`/shop/orders/${result.orderId}`);
    }

    run();
  }, [router, searchParams]);

  return (
    <div className="page-shell flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold">Payment</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
    </div>
  );
}

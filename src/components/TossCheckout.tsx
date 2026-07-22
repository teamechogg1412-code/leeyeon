"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadTossPayments,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";
import { formatPrice } from "@/lib/format";

type Props = {
  orderId: string;
  orderCode: string;
  orderName: string;
  amount: number;
  customerKey: string;
  customerName: string;
  customerEmail: string;
};

export function TossCheckout({
  orderId,
  orderCode,
  orderName,
  amount,
  customerKey,
  customerName,
  customerEmail,
}: Props) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        if (!clientKey) {
          setError("Toss 클라이언트 키가 없습니다.");
          return;
        }
        const tossPayments = await loadTossPayments(clientKey);
        const instance = tossPayments.widgets({ customerKey });
        widgetsRef.current = instance;
        await instance.setAmount({ currency: "KRW", value: amount });
        await instance.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        });
        await instance.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        });
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "결제 위젯을 불러오지 못했습니다."
          );
        }
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [amount, clientKey, customerKey]);

  async function pay() {
    if (!widgetsRef.current) return;
    await widgetsRef.current.requestPayment({
      orderId: orderCode,
      orderName,
      successUrl: `${window.location.origin}/payment/success?oid=${orderId}`,
      failUrl: `${window.location.origin}/payment/fail?oid=${orderId}`,
      customerEmail,
      customerName,
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">결제 금액</p>
        <p className="mt-1 text-2xl font-semibold">{formatPrice(amount)}</p>
        <p className="mt-2 text-sm">{orderName}</p>
      </div>

      <div id="payment-method" className="rounded-2xl bg-surface" />
      <div id="agreement" className="rounded-2xl bg-surface" />

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!ready}
        onClick={pay}
        className="w-full rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {ready ? "결제하기" : "결제 수단 준비 중..."}
      </button>
    </div>
  );
}

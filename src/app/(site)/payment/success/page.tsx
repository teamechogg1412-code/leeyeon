import { Suspense } from "react";
import PaymentSuccessClient from "./success-client";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex min-h-[50vh] items-center justify-center text-sm text-muted">
          결제 승인 중...
        </div>
      }
    >
      <PaymentSuccessClient />
    </Suspense>
  );
}

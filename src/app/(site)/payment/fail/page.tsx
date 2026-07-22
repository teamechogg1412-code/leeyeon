import Link from "next/link";

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string; oid?: string }>;
}) {
  const { code, message, oid } = await searchParams;

  return (
    <div className="page-shell flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold">결제 실패</h1>
      <p className="mt-3 text-sm text-muted">
        {message || "결제가 취소되었거나 실패했습니다."}
      </p>
      {code && <p className="mt-1 text-xs text-black/40">code: {code}</p>}
      <div className="mt-6 flex gap-3">
        <Link
          href="/shop"
          className="rounded-full border border-line px-4 py-2 text-sm"
        >
          Shop
        </Link>
        {oid && (
          <Link
            href={`/checkout/${oid}`}
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            다시 시도
          </Link>
        )}
      </div>
    </div>
  );
}

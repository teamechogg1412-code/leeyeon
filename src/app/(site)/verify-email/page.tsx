import Link from "next/link";
import { verifyEmailAction } from "@/lib/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (error === "expired") {
    return (
      <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
        <h1 className="text-2xl font-semibold">인증 링크가 만료되었습니다</h1>
        <Link href="/login" className="mt-6 text-sm underline">
          로그인
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
        <h1 className="text-2xl font-semibold">잘못된 링크입니다</h1>
        <Link href="/login" className="mt-6 text-sm underline">
          로그인
        </Link>
      </div>
    );
  }

  await verifyEmailAction(token);
}

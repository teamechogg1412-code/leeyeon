import Link from "next/link";
import { redirect } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions";
import { auth } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { token = "", error } = await searchParams;

  if (!token && error !== "expired") {
    return (
      <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
        <h1 className="text-2xl font-semibold">링크가 올바르지 않습니다</h1>
        <Link href="/forgot-password" className="mt-6 text-sm underline">
          다시 요청하기
        </Link>
      </div>
    );
  }

  if (error === "expired" || (!token && error)) {
    return (
      <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
        <h1 className="text-2xl font-semibold">링크가 만료되었습니다</h1>
        <p className="mt-2 text-sm text-muted">다시 비밀번호 찾기를 진행해 주세요.</p>
        <Link href="/forgot-password" className="mt-6 text-sm underline">
          비밀번호 찾기
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        새 비밀번호
      </h1>
      <p className="mt-2 text-sm text-muted">6자 이상 입력해 주세요.</p>
      {error === "invalid" && (
        <p className="mt-3 text-sm text-[#c81e1e]">
          비밀번호를 확인해 주세요. (6자 이상, 확인 일치)
        </p>
      )}
      <form action={resetPasswordAction} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token} />
        <input
          name="password"
          type="password"
          placeholder="새 비밀번호"
          required
          minLength={6}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <input
          name="confirm"
          type="password"
          placeholder="비밀번호 확인"
          required
          minLength={6}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-black py-2.5 text-sm text-white"
        >
          변경하기
        </button>
      </form>
    </div>
  );
}

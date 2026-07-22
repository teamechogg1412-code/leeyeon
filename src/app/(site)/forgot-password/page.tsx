import Link from "next/link";
import { redirect } from "next/navigation";
import { forgotPasswordAction } from "@/lib/actions";
import { auth } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        비밀번호 찾기
      </h1>
      <p className="mt-2 text-sm text-muted">
        가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
      </p>
      <form action={forgotPasswordAction} className="mt-8 space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-black py-2.5 text-sm text-white"
        >
          재설정 링크 받기
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-black underline">
          로그인으로
        </Link>
      </p>
    </div>
  );
}

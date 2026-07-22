import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/lib/actions";
import { auth } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Sign up
      </h1>
      {error === "exists" && (
        <p className="mt-3 text-sm text-[#c81e1e]">
          이미 사용 중인 이메일 또는 닉네임입니다.
        </p>
      )}
      <form action={registerAction} className="mt-8 space-y-4">
        <input
          name="name"
          placeholder="이름"
          required
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <input
          name="nickname"
          placeholder="닉네임"
          required
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Password (6자+)"
          required
          minLength={6}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-black py-2.5 text-sm text-white"
        >
          가입하기
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-black underline">
          로그인
        </Link>
      </p>
    </div>
  );
}

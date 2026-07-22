import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { auth } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");
  await searchParams;

  return (
    <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Login</h1>
      <p className="mt-2 text-sm text-muted">
        데모 계정: fan@fanstage.app / password123
      </p>
      <form action={loginAction} className="mt-8 space-y-4">
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
          placeholder="Password"
          required
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-black py-2.5 text-sm text-white"
        >
          로그인
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        계정이 없나요?{" "}
        <Link href="/register" className="text-black underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

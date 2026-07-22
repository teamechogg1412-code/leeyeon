import Link from "next/link";
import { isEmailConfigured } from "@/lib/email";

export default async function ForgotPasswordSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; demo?: string }>;
}) {
  const { email, demo } = await searchParams;
  const emailOn = isEmailConfigured();

  return (
    <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        메일을 확인하세요
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {email ? (
          <>
            <span className="text-black">{email}</span> 으로 비밀번호 재설정
            안내를 보냈습니다. (계정이 있는 경우에만 실제로 발송됩니다)
          </>
        ) : (
          <>비밀번호 재설정 안내를 보냈습니다.</>
        )}
      </p>

      {!emailOn && demo && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-muted">
            이메일 미설정 · 데모 링크
          </p>
          <Link
            href={`/reset-password?token=${demo}`}
            className="mt-2 block break-all text-sm text-black underline"
          >
            비밀번호 재설정 페이지 열기
          </Link>
        </div>
      )}

      <Link
        href="/login"
        className="mt-8 inline-flex justify-center rounded-full border border-line px-4 py-2 text-sm"
      >
        로그인으로
      </Link>
    </div>
  );
}

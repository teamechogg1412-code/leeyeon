import Link from "next/link";
import { resendVerifyEmailAction } from "@/lib/actions";
import { isEmailConfigured } from "@/lib/email";

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resent?: string }>;
}) {
  const { email = "", resent } = await searchParams;
  const emailOn = isEmailConfigured();

  return (
    <div className="page-shell flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        이메일 인증
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {email ? (
          <>
            <span className="text-black">{email}</span> 으로 인증 메일을
            보냈습니다. 인증 후 로그인할 수 있습니다.
          </>
        ) : (
          <>인증 메일을 확인해 주세요.</>
        )}
      </p>
      {resent && (
        <p className="mt-2 text-sm text-muted">인증 메일을 다시 보냈습니다.</p>
      )}
      {!emailOn && (
        <p className="mt-4 text-xs text-muted">
          현재 이메일 발송이 설정되지 않아, 새 계정은 자동 인증됩니다.
        </p>
      )}
      {emailOn && email && (
        <form action={resendVerifyEmailAction} className="mt-6">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 text-sm hover:bg-black/5"
          >
            인증 메일 다시 보내기
          </button>
        </form>
      )}
      <Link href="/login" className="mt-8 text-sm underline">
        로그인으로
      </Link>
    </div>
  );
}

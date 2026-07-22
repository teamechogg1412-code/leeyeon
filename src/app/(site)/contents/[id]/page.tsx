import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserAccess } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) notFound();

  const { isMember } = await getCurrentUserAccess();
  if (content.membershipRequired && !isMember) {
    return (
      <div className="page-shell max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold">멤버십 전용 콘텐츠</h1>
        <p className="mt-3 text-sm text-muted">
          이 콘텐츠는 멤버십 회원만 볼 수 있습니다.
        </p>
        <Link
          href="/shop/membership"
          className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm text-white"
        >
          멤버십 가입하기
        </Link>
      </div>
    );
  }

  return (
    <article className="page-shell max-w-2xl">
      <p className="text-xs uppercase tracking-wider text-muted">
        {content.membershipRequired ? "Members" : "Free"}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
        {content.title}
      </h1>
      <div className="mt-8 whitespace-pre-wrap text-[15px] leading-7 text-black/80">
        {content.body}
      </div>
    </article>
  );
}

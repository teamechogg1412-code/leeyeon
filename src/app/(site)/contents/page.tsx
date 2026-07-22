import Link from "next/link";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function ContentsPage() {
  const stage = await getStage();
  const { isMember } = await getCurrentUserAccess();
  const contents = await prisma.content.findMany({
    where: { stageId: stage.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
        Contents
      </h1>
      <p className="mt-2 text-sm text-muted">
        공식 콘텐츠와 멤버십 전용 콘텐츠
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contents.map((content) => {
          const locked = content.membershipRequired && !isMember;
          return (
            <Link
              key={content.id}
              href={locked ? "/shop/membership" : `/contents/${content.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div
                className="relative flex h-36 items-end bg-gradient-to-br from-[#1a1a1a] to-[#3a2a2a] p-4 text-white"
                style={
                  content.coverUrl
                    ? {
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,.55), transparent), url(${content.coverUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <span className="text-[11px] uppercase tracking-wider text-white/60">
                  {content.membershipRequired ? "Members only" : "Free"}
                </span>
              </div>
              <div className="p-4">
                <h2 className="font-medium group-hover:underline">
                  {content.title}
                </h2>
                {locked && (
                  <p className="mt-2 text-xs text-accent">
                    멤버십 가입 후 이용 가능
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

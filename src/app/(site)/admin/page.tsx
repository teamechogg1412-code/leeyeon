import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createContentAction,
  createProductAction,
  createStoryAction,
} from "@/lib/actions";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const { isOwner } = await getCurrentUserAccess();
  if (!isOwner) redirect("/login");

  const stage = await getStage();
  const [users, posts, orders, contents, products] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { board: { stageId: stage.id } } }),
    prisma.order.count(),
    prisma.content.count({ where: { stageId: stage.id } }),
    prisma.product.count({ where: { stageId: stage.id } }),
  ]);

  return (
    <div className="page-shell space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          {stage.name} 운영 대시보드
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Fans", users],
          ["Posts", posts],
          ["Orders", orders],
          ["Contents", contents],
          ["Products", products],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          action={createStoryAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">From 메시지</h2>
          <textarea
            name="body"
            rows={4}
            required
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            placeholder="팬 메시지"
          />
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            게시
          </button>
        </form>

        <form
          action={createContentAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">콘텐츠 등록</h2>
          <input
            name="title"
            required
            placeholder="제목"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <textarea
            name="body"
            rows={4}
            required
            placeholder="내용"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="membershipRequired" />
            멤버십 전용
          </label>
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            등록
          </button>
        </form>

        <form
          action={createProductAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">상품 등록</h2>
          <input
            name="name"
            required
            placeholder="상품명"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="description"
            placeholder="설명"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="price"
            type="number"
            required
            placeholder="가격"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="stock"
            type="number"
            defaultValue={50}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            등록
          </button>
        </form>
      </div>

      <Link href="/" className="text-sm text-muted">
        ← 사이트로
      </Link>
    </div>
  );
}

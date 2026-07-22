import { redirect } from "next/navigation";
import { createPostAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { boardId } = await searchParams;
  const stage = await getStage();
  const boards = await prisma.board.findMany({
    where: { stageId: stage.id },
    orderBy: { sortOrder: "asc" },
  });
  const selected = boardId || boards[0]?.id;

  return (
    <div className="page-shell max-w-xl">
      <h1 className="text-2xl font-semibold">글쓰기</h1>
      <form action={createPostAction} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">게시판</span>
          <select
            name="boardId"
            defaultValue={selected}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
                {board.membershipRequired ? " (멤버십)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">제목</span>
          <input
            name="title"
            required
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">내용</span>
          <textarea
            name="body"
            rows={10}
            required
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-black px-5 py-2.5 text-sm text-white"
        >
          등록
        </button>
      </form>
    </div>
  );
}

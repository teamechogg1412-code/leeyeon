import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createBoardAction,
  createContentAction,
  createMembershipPlanAction,
  createPopRoomAction,
  createProductAction,
  createScheduleAction,
  createStageAction,
  createStoryAction,
  updateStageAction,
} from "@/lib/actions";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const { isOwner } = await getCurrentUserAccess();
  if (!isOwner) redirect("/login");

  const stage = await getStage();
  const [users, posts, orders, contents, products, boards, plans] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { board: { stageId: stage.id } } }),
      prisma.order.count(),
      prisma.content.count({ where: { stageId: stage.id } }),
      prisma.product.count({ where: { stageId: stage.id } }),
      prisma.board.findMany({
        where: { stageId: stage.id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.membershipPlan.findMany({
        where: { stageId: stage.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="page-shell space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted">{stage.name} 운영 대시보드</p>
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

      <form
        action={createStageAction}
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
      >
        <h2 className="font-semibold">새 아티스트 스테이지</h2>
        <p className="text-xs text-muted">
          멀티 테넌트용 스테이지를 추가합니다. 생성 후 헤더에서 전환할 수 있습니다.
        </p>
        <input
          name="name"
          required
          placeholder="아티스트/스테이지 이름"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <input
          name="slug"
          required
          placeholder="슬러그 (예: seoyuna)"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <input
          name="tagline"
          placeholder="태그라인"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="설명"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-black px-4 py-2 text-sm text-white"
        >
          스테이지 만들기
        </button>
      </form>

      <form
        action={updateStageAction}
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
      >
        <h2 className="font-semibold">스테이지 설정</h2>
        <input
          name="name"
          defaultValue={stage.name}
          required
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <input
          name="tagline"
          defaultValue={stage.tagline || ""}
          placeholder="태그라인"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <textarea
          name="description"
          defaultValue={stage.description || ""}
          rows={2}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-black px-4 py-2 text-sm text-white"
        >
          저장
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          action={createBoardAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">게시판 추가</h2>
          <p className="text-xs text-muted">
            현재: {boards.map((b) => b.name).join(" · ") || "없음"}
          </p>
          <input
            name="name"
            required
            placeholder="게시판 이름"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="slug"
            required
            placeholder="slug (예: fan-talk)"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <select
            name="icon"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          >
            <option value="list">list</option>
            <option value="diamond">diamond</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="membershipRequired" />
            멤버십 전용
          </label>
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            추가
          </button>
        </form>

        <form
          action={createMembershipPlanAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">멤버십 플랜</h2>
          <p className="text-xs text-muted">
            현재 {plans.length}개 ·{" "}
            {plans.map((p) => p.name).join(", ") || "없음"}
          </p>
          <input
            name="name"
            required
            placeholder="플랜명"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="description"
            placeholder="설명"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="price"
              type="number"
              required
              placeholder="가격"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
            <input
              name="durationDays"
              type="number"
              defaultValue={365}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            />
          </div>
          <textarea
            name="benefits"
            rows={4}
            required
            placeholder={"혜택 (줄바꿈으로 구분)\n디지털 회원카드\n전용 콘텐츠"}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          action={createStoryAction}
          encType="multipart/form-data"
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
          <input name="image" type="file" accept="image/*" className="text-sm" />
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            게시
          </button>
        </form>

        <form
          action={createContentAction}
          encType="multipart/form-data"
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
          <input
            name="videoUrl"
            placeholder="영상 URL (YouTube / mp4)"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="category"
            defaultValue="OFFICIAL"
            placeholder="카테고리 (예: OFFICIAL)"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input name="image" type="file" accept="image/*" className="text-sm" />
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
          action={createPopRoomAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">POP 방 만들기</h2>
          <input
            name="title"
            required
            placeholder="POP 제목"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <textarea
            name="description"
            rows={3}
            placeholder="설명"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="live" defaultChecked />
            LIVE 표시
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="membershipRequired" />
            멤버십 전용
          </label>
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
          >
            만들기
          </button>
        </form>

        <form
          action={createScheduleAction}
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="font-semibold">일정 등록</h2>
          <input
            name="title"
            required
            placeholder="일정 제목"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <textarea
            name="description"
            rows={3}
            placeholder="설명"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="location"
            placeholder="장소"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <select
            name="category"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
            defaultValue="EVENT"
          >
            <option value="EVENT">EVENT</option>
            <option value="BROADCAST">BROADCAST</option>
            <option value="FANMEETING">FANMEETING</option>
            <option value="RELEASE">RELEASE</option>
          </select>
          <input
            name="startsAt"
            type="datetime-local"
            required
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <input
            name="endsAt"
            type="datetime-local"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="allDay" />
            하루 종일
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
          encType="multipart/form-data"
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
          <input name="image" type="file" accept="image/*" className="text-sm" />
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

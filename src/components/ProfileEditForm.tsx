"use client";

import { useActionState } from "react";
import { ImageUploadField } from "@/components/ImageUploadField";
import { updateProfileAction } from "@/lib/actions";

type State = { ok?: boolean; error?: string };

export function ProfileEditForm({
  name,
  nickname,
  bio,
}: {
  name: string;
  nickname: string;
  bio: string;
}) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    {} as State
  );

  return (
    <form action={action} encType="multipart/form-data" className="space-y-3">
      <h2 className="text-sm font-semibold">프로필 편집</h2>
      <input
        name="name"
        defaultValue={name}
        required
        placeholder="이름"
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
      />
      <input
        name="nickname"
        defaultValue={nickname}
        required
        placeholder="닉네임"
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
      />
      <textarea
        name="bio"
        defaultValue={bio}
        rows={3}
        maxLength={160}
        placeholder="한 줄 소개 (160자)"
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none"
      />
      <ImageUploadField label="프로필 사진" hint="JPG · PNG · WEBP · GIF / 5MB" compact />
      {state?.error && <p className="text-xs text-[#c81e1e]">{state.error}</p>}
      {state?.ok && (
        <p className="text-xs text-muted">프로필이 저장되었습니다.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}

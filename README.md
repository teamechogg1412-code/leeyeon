# FANSTAGE · LEE YEON

b.stage 스타일 올인원 팬 플랫폼

## Phase status

- **Phase 1** — Home / From / Contents / Community / Shop / Membership / Admin MVP
- **Phase 2** — 이미지 업로드, 검색·페이지네이션, 글/댓글 삭제, Admin 게시판·멤버십 관리
- **Phase 3** — Shop 탭/상품상세, From 피드, Home 고도화
- **Phase 4** — Contents 카테고리 캐러셀, Toss 결제 위젯(키 있으면) / 없으면 데모 결제
- **Phase 5** — Vercel Blob 업로드, Contents/Shop/From 데모 썸네일
- **Phase 6** — Schedule 캘린더 / Upcoming 일정
- **Phase 7** — POP 라이브 채팅 (폴링)
- **Phase 8** — 알림 고도화 (유형/뱃지/읽음 처리)
- **Phase 9** — POP 실시간 (SSE + 폴링 폴백)

## Toss Payments

`.env`에 테스트 키를 넣으면 결제 위젯이 활성화됩니다.

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

키가 없으면 기존처럼 **데모 결제**로 바로 주문이 완료됩니다.

> GitHub Pages(`*.github.io`)는 정적 미리보기만 제공합니다.  
> 실제 앱은 로컬 또는 **Vercel + Neon Postgres**에서 실행하세요.

## Quick start

```bash
# 1) Postgres (Docker)
docker compose up -d

# 2) Env
cp .env.example .env
# set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fanstage?schema=public
# set AUTH_SECRET to any long random string

npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Demo accounts

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| Fan   | fan@fanstage.app   | password123 |
| Owner | owner@fanstage.app | password123 |

## Deploy (Vercel)

1. GitHub repo를 [Vercel Import](https://vercel.com/new)로 연결
2. **Storage**에서 Neon Postgres 추가 (Marketplace → Neon) — `DATABASE_URL` 자동 주입
3. **Storage**에서 **Blob** 추가 (Public) — `BLOB_READ_WRITE_TOKEN` 자동 주입
4. Environment Variables 추가:
   - `AUTH_SECRET` (랜덤 긴 문자열)
5. Deploy — build에서 `prisma db push` + seed + `next build` 실행

`BLOB_READ_WRITE_TOKEN`이 없으면 업로드는 로컬 디스크에만 저장되어 Vercel에서 사라집니다.  
로컬 파일 업로드(`public/uploads`)는 개발용 폴백입니다.

## Next phase ideas

- 스케줄 리마인더 푸시
- 이미지/영상 업로드 UX 개선

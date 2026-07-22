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
- **Phase 10** — 이미지 업로드 UX (미리보기/드래그앤드롭)
- **Phase 11** — 스케줄 리마인더 (24h 알림 + hourly cron)
- **Phase 12** — 영상 직접 업로드 (Blob client upload + 로컬 폴백)
- **Phase 13** — 브라우저 푸시 알림 (Web Push + VAPID)
- **Phase 14** — 멤버십 티어 배지 / 프로필 커스텀

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
   - (선택) Web Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   - (선택) `CRON_SECRET`
5. Deploy — build에서 `prisma db push` + seed + `next build` 실행

`BLOB_READ_WRITE_TOKEN`이 없으면 업로드는 로컬 디스크에만 저장되어 Vercel에서 사라집니다.  
로컬 파일 업로드(`public/uploads`)는 개발용 폴백입니다.

### Schedule reminders

- Hourly cron: `/api/cron/schedule-reminders`
- Set `CRON_SECRET` in Vercel env (optional but recommended)
- Events starting within 24 hours notify fans once (`remindedAt`)

### Video upload

- Admin → 콘텐츠 등록에서 MP4/WEBM/MOV (최대 100MB)
- `BLOB_READ_WRITE_TOKEN` 있으면 브라우저→Blob 직행 (`/api/blob/video-upload`)
- 없으면 서버 액션 로컬 `public/uploads/videos` 폴백
- YouTube / 외부 mp4 URL도 계속 지원

### Browser push

1. Generate keys: `npx web-push generate-vapid-keys`
2. Set in `.env` / Vercel:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (예: `mailto:owner@fanstage.app`)
3. Notifications 페이지에서 **브라우저 푸시 켜기**
4. 인앱 알림(`notifyFans` / `notifyUser`)과 함께 OS 푸시도 발송

키가 없으면 인앱 알림만 동작하고 푸시는 건너뜁니다.

## Next phase ideas

- 멤버십 티어별 배지 / 프로필 커스텀
- 검색·필터 고도화

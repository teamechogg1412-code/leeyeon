# FANSTAGE · LEE YEON

b.stage 스타일 올인원 팬 플랫폼

## Phase status

- **Phase 1** — Home / From / Contents / Community / Shop / Membership / Admin MVP
- **Phase 2** — 이미지 업로드, 검색·페이지네이션, 글/댓글 삭제, Admin 게시판·멤버십 관리, Vercel 준비

> GitHub Pages(`*.github.io`)는 정적 미리보기만 제공합니다.  
> 실제 앱은 로컬 또는 Vercel에서 실행하세요.

## Quick start

```bash
cp .env.example .env
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

1. GitHub repo를 Vercel에 Import
2. Environment Variables:
   - `DATABASE_URL` (권장: Neon/Postgres — SQLite는 Vercel에서 비권장)
   - `AUTH_SECRET` (랜덤 문자열)
3. Build Command: `prisma migrate deploy && prisma db seed && next build` (또는 Dashboard에서 설정)
4. Deploy

로컬 파일 업로드(`public/uploads`)는 Vercel 서버리스에서 영구 저장되지 않습니다.  
프로덕션에서는 S3/Cloudflare R2/Vercel Blob로 교체하면 됩니다.

## Next phase ideas

- 실제 PG 결제 (Toss/Stripe)
- 클라우드 이미지 스토리지
- 멀티 테넌트 (여러 아티스트)
- 라이브 / POP 채팅

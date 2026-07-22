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
- **Phase 15** — 검색·필터 고도화
- **Phase 16** — 오너 대시보드 통계
- **Phase 17** — 비밀번호 찾기 / 이메일 인증
- **Phase 18** — 주문·배송 관리 UI
- **Phase 19** — PWA (manifest, offline shell, install banner)
- **Phase 20** — Toss 실결제 전환 (계획) — 테스트키 → 라이브키, 데모 폴백 정리, 운영 보완
- **영상 하이브리드** — YouTube 링크(권장) + 직접 업로드(짧은 전용 클립) 병행

## 영상 하이브리드

공식 Contents 영상은 두 방식을 같이 씁니다.

| 방식 | 언제 | 비용 |
|------|------|------|
| **YouTube 링크 (권장)** | 긴 영상, 공개·일부공개 | 서버 전송비 거의 없음 |
| **직접 업로드** | 짧은 멤버십 전용 클립 등 | Blob 저장·재생량에 비례 |

- 관리자 콘텐츠 등록에서 YouTube / 업로드를 함께 제공
- 둘 다 넣으면 **YouTube를 우선** 사용
- 재생 페이지는 YouTube면 iframe, 파일이면 `<video>` 자동 선택
- 팬 커뮤니티 영상 업로드는 여전히 없음 (이미지·글만)

## Phase 20 — Toss 실결제 구현 계획

이미 **위젯 체크아웃 + confirm API** 코드는 있음. 키가 없으면 데모 결제(즉시 완료)로 동작 중.
토스는 PG라서 팬이 토스 앱을 쓸 필요는 없고, 카드 등 수단으로 결제 가능.
(다른 PG·Stripe는 필요 시 별도 Phase로 검토)

### 목표
데모 결제를 끄고, 멤버십·MD를 **토스페이먼츠로 실제 결제**하게 만든다.

### 현재 상태
| 항목 | 상태 |
|------|------|
| 주문 생성 → `/checkout` → 토스 위젯 | ✅ |
| `/payment/success` → confirm → `fulfillPaidOrder` | ✅ |
| `/payment/fail` | ✅ |
| env 없으면 데모 즉시 결제 | ✅ (실서비스 전 차단 필요) |
| 웹훅 / 환불 / PENDING 만료 | ❌ |
| UI “데모 결제” 문구 | ❌ 정리 필요 |

### 구현 단계

1. **테스트 키 연동**
   - 토스 개발자센터에서 `test_ck_` / `test_sk_` 발급
   - Vercel env: `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
   - Redeploy 후 멤버십·MD 구매로 위젯·테스트카드 확인

2. **데모 폴백 정리**
   - 프로덕션에서 키 없으면 구매 버튼 비활성 / 에러
   - 버튼 문구: “데모 결제” → “결제하기”
   - (선택) `PAYMENT_MODE=demo|toss` 로 로컬만 데모 허용

3. **결제 수단**
   - 토스 상점 설정에서 카드·간편결제(카카오/네이버 등) 활성화
   - 위젯 `variantKey`는 기본 `DEFAULT` 유지, 필요 시 커스텀

4. **운영 보완 (실서비스 전 권장)**
   - 결제 웹훅: 성공 리다이렉트 유실 시에도 주문 확정
   - 미결제(`PENDING`) 주문 만료·취소
   - 관리자 환불/취소 → 토스 취소 API
   - 배송지: 가능하면 결제 전 입력
   - confirm 시 금액·`orderCode` 재검증 유지, secret 없을 때 fulfill 금지

5. **라이브 전환**
   - 사업자 심사·계약 완료 후 `live_ck_` / `live_sk_` 교체
   - 성공/실패 URL 도메인(`leeyeon.vercel.app`) 등록
   - 소액 실결제 1건 검증 후 오픈

### env
```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...   # 라이브: live_ck_...
TOSS_SECRET_KEY=test_sk_...               # 라이브: live_sk_...
```

### 관련 경로
- `src/components/TossCheckout.tsx`
- `src/app/(site)/checkout/[orderId]/page.tsx`
- `src/app/(site)/payment/success|fail`
- `src/lib/actions.ts` (`purchase*`, `confirmTossPaymentAction`)
- `src/lib/fulfill.ts`, `src/lib/order.ts`

## Toss Payments (요약)

키가 있으면 위젯 결제, 없으면 **데모 결제**. 실사용은 **Phase 20** 참고.

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
   - (선택) Toss 결제: `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` (없으면 데모 결제 — Phase 20)
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

### Membership badges & profile

- Plans have `tierLabel` / `badgeColor` (Admin에서 설정)
- Badges show on My Page, community, contents comments, POP
- `/me`에서 닉네임·한줄소개·프로필 사진 수정 + 디지털 회원카드

### Search & filters

- Header 검색 아이콘 → `/search` 통합 검색
- Contents: 카테고리 / 무료·멤버십 / 최신·인기
- Community: 검색 + 최신·댓글·조회순
- Shop / From / Schedule: 검색 (+ Schedule 카테고리 필터)

### Owner dashboard

- `/admin` — 팬·멤버·매출·주문 요약
- 7일 가입/결제 막대 차트, 멤버십 티어별 현황
- 인기 콘텐츠 · 최근 주문

### Password reset & email verify

- `/forgot-password` → 재설정 메일 (또는 데모 링크)
- `/reset-password?token=…`
- Resend 설정 시 가입 후 이메일 인증 필요 (`RESEND_API_KEY`, `EMAIL_FROM`)
- 미설정 시 가입 즉시 인증 처리 (데모 계정 그대로 사용)

### Order & shipping

- Admin → **주문 · 배송 관리** (`/admin/orders`)
- 상품 주문: READY → PREPARING → SHIPPED → DELIVERED
- 송장·주소 입력, 상태 변경 시 팬 알림
- 팬은 `/shop/orders/[id]`에서 배송지 입력·배송 현황 확인


### PWA (Phase 19)

- `src/app/manifest.ts` — standalone app, theme `#111111`, 192/512 icons
- `public/sw.js` — shell cache `leeyeon-shell-v1`, offline fallback, Web Push handlers
- `public/offline.html` — offline navigation fallback
- Root layout registers `/sw.js` and shows install banner (`beforeinstallprompt` + iOS hint)
- Dismiss install banner with localStorage key `pwa-install-dismissed`
- Icons in `public/icons/` (192, 512, apple-touch)

## Next phase ideas


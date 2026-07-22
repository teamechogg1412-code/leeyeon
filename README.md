# FANSTAGE · LEE YEON

b.stage 스타일 올인원 팬 플랫폼 MVP

> **GitHub Pages** (`*.github.io`) 는 정적 파일만 호스팅합니다.  
> Next.js + DB + 로그인이 필요한 **실제 앱**은 아래 Quick start로 실행하세요.  
> github.io 주소에는 UI 미리보기(`index.html`)가 표시됩니다.

- Home / From / Contents / Community / Shop
- 멤버십 권한 · 디지털 회원카드
- 데모 결제(주문) · 알림 · 오너 Admin

## Quick start (실제 앱)

```bash
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

Open http://localhost:3000

## Demo accounts

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| Fan   | fan@fanstage.app   | password123 |
| Owner | owner@fanstage.app | password123 |

`fan@fanstage.app` 은 멤버십이 이미 활성화되어 있습니다.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Seed skipped — database already has users.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.create({
    data: {
      email: "owner@fanstage.app",
      passwordHash,
      name: "이연",
      nickname: "official_leeyeon",
      role: "OWNER",
    },
  });

  const fan = await prisma.user.create({
    data: {
      email: "fan@fanstage.app",
      passwordHash,
      name: "Fan",
      nickname: "귤한입",
      role: "FAN",
    },
  });

  const fan2 = await prisma.user.create({
    data: {
      email: "fan2@fanstage.app",
      passwordHash,
      name: "Fan Two",
      nickname: "연이최고",
      role: "FAN",
    },
  });

  const stage = await prisma.stage.create({
    data: {
      name: "LEE YEON",
      slug: "leeyeon",
      tagline: "Official Fan Community",
      heroUrl: "/uploads/leeyeon-hero.jpg",
      description:
        "배우 이연 공식 팬 커뮤니티 · 콘텐츠 · 멤버십 · 샵을 한곳에서.",
    },
  });

  const freeTalk = await prisma.board.create({
    data: {
      stageId: stage.id,
      name: "FREE TALK",
      slug: "free-talk",
      icon: "list",
      sortOrder: 1,
    },
  });

  const toYeon = await prisma.board.create({
    data: {
      stageId: stage.id,
      name: "To. Yeon",
      slug: "to-yeon",
      icon: "list",
      sortOrder: 2,
    },
  });

  await prisma.board.create({
    data: {
      stageId: stage.id,
      name: "OFF-SHOT",
      slug: "off-shot",
      icon: "diamond",
      sortOrder: 3,
      membershipRequired: true,
    },
  });

  const posts = await Promise.all([
    prisma.post.create({
      data: {
        boardId: freeTalk.id,
        authorId: fan.id,
        title: "내 배경화면이 하루를 못가네...",
        body: "이연 배우님 사진으로 배경화면 바꿨는데 너무 예뻐서 계속 보게 돼요. 다들 어떤 컷 쓰시나요?",
      },
    }),
    prisma.post.create({
      data: {
        boardId: freeTalk.id,
        authorId: fan2.id,
        title: "팬미팅",
        body: "팬미팅 티켓팅 다들 준비 잘 하고 계신가요? 파이팅입니다!",
      },
    }),
    prisma.post.create({
      data: {
        boardId: freeTalk.id,
        authorId: fan.id,
        title: "팬레터 쓰려고 손글씨 연습중",
        body: "팬레터에 정성 담아 쓰려고 글씨 연습 중입니다. 팁 있으신 분?",
      },
    }),
    prisma.post.create({
      data: {
        boardId: toYeon.id,
        authorId: fan2.id,
        title: "이연님 항상 응원해요",
        body: "무대 위에서든 오프에서든 늘 멋있어요. 건강 챙기세요!",
      },
    }),
  ]);

  await prisma.comment.create({
    data: {
      postId: posts[0].id,
      authorId: fan2.id,
      body: "오!! 저도 이거 너무 귀여워서 바로 저장이요😆",
    },
  });

  await prisma.comment.create({
    data: {
      postId: posts[1].id,
      authorId: fan.id,
      body: "티켓팅 성공 예지몽인가봐요~~축하해요",
    },
  });

  await prisma.story.createMany({
    data: [
      {
        stageId: stage.id,
        authorId: owner.id,
        body: "안녕하세요, 이연입니다. 공식 커뮤니티에서 반갑게 만나요.",
      },
      {
        stageId: stage.id,
        authorId: owner.id,
        body: "오늘도 촬영 잘 마쳤어요. 응원 감사해요!",
      },
    ],
  });

  await prisma.content.createMany({
    data: [
      {
        stageId: stage.id,
        title: "'사랑의 맘보' 퍼포먼스 클립💌",
        body: "이연의 퍼포먼스 클립을 만나보세요.\n#퍼포먼스 #공식콘텐츠",
        category: "사랑의 맘보",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: false,
      },
      {
        stageId: stage.id,
        title: "첫 인사 영상",
        body: "공식 플랫폼 오픈을 맞아 이연이 전하는 첫 인사입니다.",
        category: "OFFICIAL",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: false,
      },
      {
        stageId: stage.id,
        title: "멤버십 전용 비하인드",
        body: "촬영장 비하인드 컷과 메시지를 멤버십 회원에게만 공개합니다.",
        category: "OFFICIAL",
        membershipRequired: true,
      },
    ],
  });

  const plan = await prisma.membershipPlan.create({
    data: {
      stageId: stage.id,
      name: "Official Membership",
      description: "디지털 회원카드 · 전용 콘텐츠 · 전용 커뮤니티",
      price: 39000,
      durationDays: 365,
      benefits:
        "디지털 회원카드|멤버십 전용 콘텐츠|OFF-SHOT 게시판|이벤트 우선 안내",
    },
  });

  await prisma.product.createMany({
    data: [
      {
        stageId: stage.id,
        name: "공식 포토카드 세트",
        description: "시즌 한정 포토카드 8종 세트",
        price: 18000,
        stock: 50,
      },
      {
        stageId: stage.id,
        name: "응원봉 키링",
        description: "미니 응원봉 키링",
        price: 12000,
        stock: 100,
      },
    ],
  });

  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 1);

  await prisma.membership.create({
    data: {
      userId: fan.id,
      planId: plan.id,
      status: "ACTIVE",
      endsAt,
    },
  });

  console.log("Seed complete");
  console.log("Owner: owner@fanstage.app / password123");
  console.log("Fan:   fan@fanstage.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO = {
  hero: "/brand/leeyeon-hero.jpg",
  stories: [
    {
      body: "안녕하세요, 이연입니다. 공식 커뮤니티에서 반갑게 만나요.",
      imageUrl: "/brand/story-morning.jpg",
    },
    {
      body: "오늘도 촬영 잘 마쳤어요. 응원 감사해요!",
      imageUrl: "/brand/story-night.jpg",
    },
  ],
  contents: [
    {
      title: "'사랑의 맘보' 퍼포먼스 클립💌",
      coverUrl: "/brand/content-mambo.jpg",
    },
    {
      title: "첫 인사 영상",
      coverUrl: "/brand/content-hello.jpg",
    },
    {
      title: "멤버십 전용 비하인드",
      coverUrl: "/brand/content-behind.jpg",
    },
  ],
  products: [
    {
      name: "공식 포토카드 세트",
      imageUrl: "/brand/product-photocard.jpg",
    },
    {
      name: "응원봉 키링",
      imageUrl: "/brand/product-keyring.jpg",
    },
  ],
};

async function ensureDemoMedia() {
  await prisma.stage.updateMany({
    data: { heroUrl: DEMO.hero },
  });

  for (const story of DEMO.stories) {
    await prisma.story.updateMany({
      where: { body: story.body },
      data: { imageUrl: story.imageUrl },
    });
  }

  for (const content of DEMO.contents) {
    await prisma.content.updateMany({
      where: { title: content.title },
      data: { coverUrl: content.coverUrl },
    });
  }

  for (const product of DEMO.products) {
    await prisma.product.updateMany({
      where: { name: product.name },
      data: { imageUrl: product.imageUrl },
    });
  }

  const stage = await prisma.stage.findFirst({ orderBy: { createdAt: "asc" } });
  if (stage) {
    const scheduleCount = await prisma.scheduleEvent.count({
      where: { stageId: stage.id },
    });
    if (scheduleCount === 0) {
      const now = new Date();
      await prisma.scheduleEvent.createMany({
        data: [
          {
            stageId: stage.id,
            title: "LEE YEON Official Membership Open",
            description: "공식 멤버십 오픈 안내",
            category: "EVENT",
            allDay: true,
            startsAt: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 2
            ),
          },
          {
            stageId: stage.id,
            title: "라디오 게스트 출연",
            description: "심야 라디오 라이브 출연",
            location: "방송국",
            category: "BROADCAST",
            startsAt: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 5,
              22,
              0
            ),
          },
          {
            stageId: stage.id,
            title: "팬미팅 티켓 오픈",
            description: "2026 팬미팅 선예매",
            category: "FANMEETING",
            startsAt: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 9,
              20,
              0
            ),
          },
          {
            stageId: stage.id,
            title: "시즌 포토카드 출시",
            description: "공식 샵 한정 발매",
            category: "RELEASE",
            allDay: true,
            startsAt: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 14
            ),
          },
        ],
      });
    }

    const soonCount = await prisma.scheduleEvent.count({
      where: {
        stageId: stage.id,
        startsAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
    });
    if (soonCount === 0) {
      const soon = new Date(Date.now() + 6 * 60 * 60 * 1000);
      await prisma.scheduleEvent.create({
        data: {
          stageId: stage.id,
          title: "오늘 밤 짧은 인사 LIVE",
          description: "24시간 이내 리마인더 데모 일정",
          category: "BROADCAST",
          startsAt: soon,
        },
      });
    }

    const popCount = await prisma.popRoom.count({
      where: { stageId: stage.id },
    });
    if (popCount === 0) {
      const owner = await prisma.user.findFirst({
        where: { role: "OWNER" },
      });
      const room = await prisma.popRoom.create({
        data: {
          stageId: stage.id,
          title: "오늘도 수고했어요 🌙",
          description: "짧게 인사하고 가는 LIVE POP",
          live: true,
          membershipRequired: false,
        },
      });
      if (owner) {
        await prisma.popMessage.createMany({
          data: [
            {
              roomId: room.id,
              authorId: owner.id,
              body: "안녕하세요, 이연입니다. POP에 와줘서 고마워요!",
            },
            {
              roomId: room.id,
              authorId: owner.id,
              body: "오늘 하루 잘 보내셨나요? 댓글로 안부인사 남겨주세요.",
            },
          ],
        });
      }

      await prisma.popRoom.create({
        data: {
          stageId: stage.id,
          title: "멤버십 전용 심야 POP",
          description: "멤버만 입장 가능한 비하인드 토크",
          live: false,
          membershipRequired: true,
        },
      });
    }

    const fans = await prisma.user.findMany({
      where: { role: "FAN" },
      select: { id: true },
      take: 20,
    });
    for (const fan of fans) {
      const existingNoti = await prisma.notification.count({
        where: { userId: fan.id },
      });
      if (existingNoti === 0) {
        await prisma.notification.createMany({
          data: [
            {
              userId: fan.id,
              type: "FROM",
              title: "새 From 소식",
              body: "안녕하세요, 이연입니다. 공식 커뮤니티에서 반갑게 만나요.",
              href: "/from",
              read: false,
            },
            {
              userId: fan.id,
              type: "SCHEDULE",
              title: "새 일정",
              body: "팬미팅 티켓 오픈",
              href: "/schedule",
              read: false,
            },
            {
              userId: fan.id,
              type: "POP",
              title: "POP LIVE 시작",
              body: "오늘도 수고했어요 🌙",
              href: "/pop",
              read: false,
            },
          ],
        });
      }
    }

    // Keep product as single-artist (LEE YEON). Remove accidental demo stage if present.
    await prisma.stage.deleteMany({ where: { slug: "seoyuna" } });
  }

  console.log("Demo media URLs ensured.");
}

async function main() {
  await ensureDemoMedia();

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
      heroUrl: DEMO.hero,
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
    data: DEMO.stories.map((story) => ({
      stageId: stage.id,
      authorId: owner.id,
      body: story.body,
      imageUrl: story.imageUrl,
    })),
  });

  await prisma.content.createMany({
    data: [
      {
        stageId: stage.id,
        title: DEMO.contents[0].title,
        body: "이연의 퍼포먼스 클립을 만나보세요.\n#퍼포먼스 #공식콘텐츠",
        category: "사랑의 맘보",
        coverUrl: DEMO.contents[0].coverUrl,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: false,
      },
      {
        stageId: stage.id,
        title: DEMO.contents[1].title,
        body: "공식 플랫폼 오픈을 맞아 이연이 전하는 첫 인사입니다.",
        category: "OFFICIAL",
        coverUrl: DEMO.contents[1].coverUrl,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: false,
      },
      {
        stageId: stage.id,
        title: DEMO.contents[2].title,
        body: "촬영장 비하인드 컷과 메시지를 멤버십 회원에게만 공개합니다.",
        category: "OFFICIAL",
        coverUrl: DEMO.contents[2].coverUrl,
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
    data: DEMO.products.map((product) => ({
      stageId: stage.id,
      name: product.name,
      description:
        product.name === "공식 포토카드 세트"
          ? "시즌 한정 포토카드 8종 세트"
          : "미니 응원봉 키링",
      price: product.name === "공식 포토카드 세트" ? 18000 : 12000,
      stock: product.name === "공식 포토카드 세트" ? 50 : 100,
      imageUrl: product.imageUrl,
    })),
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

  const now = new Date();
  await prisma.scheduleEvent.createMany({
    data: [
      {
        stageId: stage.id,
        title: "오늘 밤 짧은 인사 LIVE",
        description: "24시간 이내 리마인더 데모 일정",
        category: "BROADCAST",
        startsAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      {
        stageId: stage.id,
        title: "LEE YEON Official Membership Open",
        description: "공식 멤버십 오픈 안내",
        category: "EVENT",
        allDay: true,
        startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
      },
      {
        stageId: stage.id,
        title: "라디오 게스트 출연",
        description: "심야 라디오 라이브 출연",
        location: "방송국",
        category: "BROADCAST",
        startsAt: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 5,
          22,
          0
        ),
      },
      {
        stageId: stage.id,
        title: "팬미팅 티켓 오픈",
        description: "2026 팬미팅 선예매",
        category: "FANMEETING",
        startsAt: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 9,
          20,
          0
        ),
      },
      {
        stageId: stage.id,
        title: "시즌 포토카드 출시",
        description: "공식 샵 한정 발매",
        category: "RELEASE",
        allDay: true,
        startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      },
    ],
  });

  const pop = await prisma.popRoom.create({
    data: {
      stageId: stage.id,
      title: "오늘도 수고했어요 🌙",
      description: "짧게 인사하고 가는 LIVE POP",
      live: true,
      membershipRequired: false,
    },
  });

  await prisma.popMessage.createMany({
    data: [
      {
        roomId: pop.id,
        authorId: owner.id,
        body: "안녕하세요, 이연입니다. POP에 와줘서 고마워요!",
      },
      {
        roomId: pop.id,
        authorId: owner.id,
        body: "오늘 하루 잘 보내셨나요? 댓글로 안부인사 남겨주세요.",
      },
      {
        roomId: pop.id,
        authorId: fan.id,
        body: "이연님 오늘도 고생 많으셨어요!!",
      },
    ],
  });

  await prisma.popRoom.create({
    data: {
      stageId: stage.id,
      title: "멤버십 전용 심야 POP",
      description: "멤버만 입장 가능한 비하인드 토크",
      live: false,
      membershipRequired: true,
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

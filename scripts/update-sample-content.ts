import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const content = await prisma.content.findFirst({
    where: { membershipRequired: false },
  });
  if (!content) {
    console.log("No free content found");
    return;
  }
  await prisma.content.update({
    where: { id: content.id },
    data: {
      title: "'사랑의 맘보' 퍼포먼스 클립💌",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      body: "이연의 퍼포먼스 클립을 만나보세요.\n#퍼포먼스 #공식콘텐츠",
    },
  });
  console.log("Updated content:", content.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

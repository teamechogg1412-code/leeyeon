import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const free = await prisma.content.findMany({
    where: { membershipRequired: false },
    orderBy: { createdAt: "asc" },
  });
  if (free[0]) {
    await prisma.content.update({
      where: { id: free[0].id },
      data: {
        category: "사랑의 맘보",
        title: "'사랑의 맘보' 퍼포먼스 클립💌",
        videoUrl: free[0].videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    });
  }
  if (free[1]) {
    await prisma.content.update({
      where: { id: free[1].id },
      data: { category: "OFFICIAL" },
    });
  }
  await prisma.content.updateMany({
    where: { membershipRequired: true },
    data: { category: "OFFICIAL" },
  });
  console.log("categories updated");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

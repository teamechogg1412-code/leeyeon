-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FAN',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "heroUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'list',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "membershipRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OFFICIAL',
    "coverUrl" TEXT,
    "videoUrl" TEXT,
    "membershipRequired" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentComment" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReaction" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 365,
    "benefits" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" INTEGER NOT NULL,
    "orderCode" TEXT NOT NULL,
    "paymentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "planId" TEXT,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_slug_key" ON "Stage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Board_stageId_slug_key" ON "Board"("stageId", "slug");

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_type_key" ON "PostReaction"("postId", "userId", "type");

-- CreateIndex
CREATE INDEX "ContentComment_contentId_idx" ON "ContentComment"("contentId");

-- CreateIndex
CREATE INDEX "ContentReaction_contentId_idx" ON "ContentReaction"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentReaction_contentId_userId_type_key" ON "ContentReaction"("contentId", "userId", "type");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentComment" ADD CONSTRAINT "ContentComment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentComment" ADD CONSTRAINT "ContentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReaction" ADD CONSTRAINT "ContentReaction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReaction" ADD CONSTRAINT "ContentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


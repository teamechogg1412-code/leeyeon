"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { saveUploadedImage } from "@/lib/upload";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
}

export async function registerAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();

  if (!email || !password || !name || !nickname || password.length < 6) {
    redirect("/register");
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  });
  if (exists) {
    redirect("/register");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, name, nickname, role: "FAN" },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createPostAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const boardId = String(formData.get("boardId") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!boardId || !title || !body) redirect("/community");

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) redirect("/community");

  const { isMember, isOwner } = await getCurrentUserAccess();
  if (board.membershipRequired && !isMember && !isOwner) {
    redirect("/shop/membership");
  }

  const image = formData.get("image");
  const imageUrl = await saveUploadedImage(
    image instanceof File ? image : null,
    "posts"
  );

  const post = await prisma.post.create({
    data: {
      boardId,
      authorId: session.user.id,
      title,
      body,
      imageUrl,
    },
  });

  revalidatePath("/community");
  redirect(`/community/post/${post.id}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const postId = String(formData.get("postId") || "");
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) redirect("/community");

  const isOwner =
    session.user.role === "OWNER" || session.user.role === "ADMIN";
  if (post.authorId !== session.user.id && !isOwner) {
    redirect(`/community/post/${postId}`);
  }

  const boardId = post.boardId;
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/community");
  redirect(`/community/board/${boardId}`);
}

export async function createCommentAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const postId = String(formData.get("postId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!postId || !body) return;

  await prisma.comment.create({
    data: { postId, authorId: session.user.id, body },
  });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true },
  });
  if (post && post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        title: "새 댓글",
        body: `"${post.title}"에 댓글이 달렸습니다.`,
        href: `/community/post/${postId}`,
      },
    });
  }

  revalidatePath(`/community/post/${postId}`);
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const commentId = String(formData.get("commentId") || "");
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return;

  const isOwner =
    session.user.role === "OWNER" || session.user.role === "ADMIN";
  if (comment.authorId !== session.user.id && !isOwner) return;

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/community/post/${comment.postId}`);
}

export async function purchaseMembershipAction(planId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) redirect("/shop/membership");

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + plan.durationDays);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      type: "MEMBERSHIP",
      status: "PAID",
      total: plan.price,
      items: {
        create: {
          planId: plan.id,
          title: plan.name,
          price: plan.price,
          quantity: 1,
        },
      },
    },
  });

  await prisma.membership.updateMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  await prisma.membership.create({
    data: {
      userId: session.user.id,
      planId: plan.id,
      status: "ACTIVE",
      endsAt,
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "멤버십 가입 완료",
      body: `${plan.name} 멤버십이 활성화되었습니다.`,
      href: "/shop/membership",
    },
  });

  revalidatePath("/shop");
  revalidatePath("/contents");
  revalidatePath("/community");
  redirect(`/shop/orders/${order.id}`);
}

export async function purchaseProductAction(productId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active || product.stock < 1) {
    redirect("/shop");
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      type: "PRODUCT",
      status: "PAID",
      total: product.price,
      items: {
        create: {
          productId: product.id,
          title: product.name,
          price: product.price,
          quantity: 1,
        },
      },
    },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { stock: { decrement: 1 } },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "주문 완료",
      body: `${product.name} 주문이 완료되었습니다.`,
      href: `/shop/orders/${order.id}`,
    },
  });

  revalidatePath("/shop");
  redirect(`/shop/orders/${order.id}`);
}

export async function createStoryAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const body = String(formData.get("body") || "").trim();
  if (!body) redirect("/from");

  const image = formData.get("image");
  const imageUrl = await saveUploadedImage(
    image instanceof File ? image : null,
    "stories"
  );

  const stage = await getStage();
  await prisma.story.create({
    data: {
      stageId: stage.id,
      authorId: session.user.id,
      body,
      imageUrl,
    },
  });

  revalidatePath("/from");
  redirect("/from");
}

export async function createContentAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const membershipRequired = formData.get("membershipRequired") === "on";
  if (!title || !body) redirect("/admin");

  const image = formData.get("image");
  const coverUrl = await saveUploadedImage(
    image instanceof File ? image : null,
    "contents"
  );

  const stage = await getStage();
  await prisma.content.create({
    data: {
      stageId: stage.id,
      title,
      body,
      coverUrl,
      membershipRequired,
    },
  });

  revalidatePath("/contents");
  revalidatePath("/admin");
  redirect("/contents");
}

export async function createProductAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);
  if (!name || price <= 0) redirect("/admin");

  const image = formData.get("image");
  const imageUrl = await saveUploadedImage(
    image instanceof File ? image : null,
    "products"
  );

  const stage = await getStage();
  await prisma.product.create({
    data: {
      stageId: stage.id,
      name,
      description,
      price,
      stock,
      imageUrl,
    },
  });

  revalidatePath("/shop");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createBoardAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const membershipRequired = formData.get("membershipRequired") === "on";
  const icon = String(formData.get("icon") || "list");
  if (!name || !slug) redirect("/admin");

  const stage = await getStage();
  const last = await prisma.board.findFirst({
    where: { stageId: stage.id },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.board.create({
    data: {
      stageId: stage.id,
      name,
      slug,
      icon,
      membershipRequired,
      sortOrder: (last?.sortOrder || 0) + 1,
    },
  });

  revalidatePath("/community");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createMembershipPlanAction(
  formData: FormData
): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const durationDays = Number(formData.get("durationDays") || 365);
  const benefits = String(formData.get("benefits") || "")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean)
    .join("|");

  if (!name || price <= 0 || !benefits) redirect("/admin");

  const stage = await getStage();
  await prisma.membershipPlan.create({
    data: {
      stageId: stage.id,
      name,
      description,
      price,
      durationDays,
      benefits,
    },
  });

  revalidatePath("/shop");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateStageAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) redirect("/admin");

  const stage = await getStage();
  await prisma.stage.update({
    where: { id: stage.id },
    data: { name, tagline, description },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

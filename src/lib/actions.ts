"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillPaidOrder } from "@/lib/fulfill";
import { createOrderCode, isTossEnabled } from "@/lib/order";
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

export async function toggleReactionAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const postId = String(formData.get("postId") || "");
  const type = String(formData.get("type") || "");
  if (!postId || !["like", "love", "cool"].includes(type)) return;

  const existing = await prisma.postReaction.findUnique({
    where: {
      postId_userId_type: {
        postId,
        userId: session.user.id,
        type,
      },
    },
  });

  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.postReaction.create({
      data: { postId, userId: session.user.id, type },
    });
  }

  revalidatePath(`/community/post/${postId}`);
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

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      type: "MEMBERSHIP",
      status: "PENDING",
      total: plan.price,
      orderCode: createOrderCode("mem"),
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

  if (!isTossEnabled()) {
    await fulfillPaidOrder(order.id);
    revalidatePath("/shop");
    revalidatePath("/contents");
    revalidatePath("/community");
    redirect(`/shop/orders/${order.id}`);
  }

  redirect(`/checkout/${order.id}`);
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
      status: "PENDING",
      total: product.price,
      orderCode: createOrderCode("prd"),
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

  if (!isTossEnabled()) {
    await fulfillPaidOrder(order.id);
    revalidatePath("/shop");
    redirect(`/shop/orders/${order.id}`);
  }

  redirect(`/checkout/${order.id}`);
}

export async function confirmTossPaymentAction(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<{ ok: true; orderId: string } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: input.orderId }, { orderCode: input.orderId }],
      userId: session.user.id,
    },
  });
  if (!order) return { ok: false, message: "주문을 찾을 수 없습니다." };
  if (order.total !== input.amount) {
    return { ok: false, message: "결제 금액이 일치하지 않습니다." };
  }
  if (order.status === "PAID") return { ok: true, orderId: order.id };

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    await fulfillPaidOrder(order.id);
    return { ok: true, orderId: order.id };
  }

  const encrypted = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encrypted}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: order.orderCode,
      amount: input.amount,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      ok: false,
      message: err?.message || "결제 승인에 실패했습니다.",
    };
  }

  await fulfillPaidOrder(order.id, input.paymentKey);
  revalidatePath("/shop");
  revalidatePath("/contents");
  revalidatePath("/community");
  return { ok: true, orderId: order.id };
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
  const category = String(formData.get("category") || "OFFICIAL").trim();
  const videoUrl = String(formData.get("videoUrl") || "").trim() || null;
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
      category: category || "OFFICIAL",
      coverUrl,
      videoUrl,
      membershipRequired,
    },
  });

  revalidatePath("/contents");
  revalidatePath("/admin");
  redirect("/contents");
}

export async function createContentCommentAction(
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const contentId = String(formData.get("contentId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!contentId || !body) return;

  await prisma.contentComment.create({
    data: { contentId, authorId: session.user.id, body },
  });

  revalidatePath(`/contents/${contentId}`);
}

export async function deleteContentCommentAction(
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const commentId = String(formData.get("commentId") || "");
  const comment = await prisma.contentComment.findUnique({
    where: { id: commentId },
  });
  if (!comment) return;

  const isOwner =
    session.user.role === "OWNER" || session.user.role === "ADMIN";
  if (comment.authorId !== session.user.id && !isOwner) return;

  await prisma.contentComment.delete({ where: { id: commentId } });
  revalidatePath(`/contents/${comment.contentId}`);
}

export async function toggleContentReactionAction(
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const contentId = String(formData.get("contentId") || "");
  const type = String(formData.get("type") || "");
  const allowed = ["like", "love", "cool", "fire", "clap", "wow"];
  if (!contentId || !allowed.includes(type)) return;

  const existing = await prisma.contentReaction.findUnique({
    where: {
      contentId_userId_type: {
        contentId,
        userId: session.user.id,
        type,
      },
    },
  });

  if (existing) {
    await prisma.contentReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.contentReaction.create({
      data: { contentId, userId: session.user.id, type },
    });
  }

  revalidatePath(`/contents/${contentId}`);
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

export async function createScheduleAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const category = String(formData.get("category") || "EVENT").trim() || "EVENT";
  const startsAtRaw = String(formData.get("startsAt") || "").trim();
  const endsAtRaw = String(formData.get("endsAt") || "").trim();
  const allDay = formData.get("allDay") === "on";
  if (!title || !startsAtRaw) redirect("/admin");

  const startsAt = new Date(startsAtRaw);
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (Number.isNaN(startsAt.getTime())) redirect("/admin");

  const stage = await getStage();
  await prisma.scheduleEvent.create({
    data: {
      stageId: stage.id,
      title,
      description,
      location,
      category,
      startsAt,
      endsAt:
        endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
      allDay,
    },
  });

  revalidatePath("/schedule");
  revalidatePath("/admin");
  redirect("/schedule");
}

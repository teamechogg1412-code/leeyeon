"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillPaidOrder } from "@/lib/fulfill";
import { createOrderCode, isTossEnabled } from "@/lib/order";
import { getCurrentUserAccess, getStage } from "@/lib/stage";
import { saveUploadedImage, saveUploadedVideo } from "@/lib/upload";
import { getYoutubeEmbedUrl } from "@/lib/media";
import { notifyFans, notifyUser } from "@/lib/notify";
import {
  appBaseUrl,
  consumeAuthToken,
  createAuthToken,
  isEmailConfigured,
  sendEmail,
} from "@/lib/email";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");

  if (isEmailConfigured()) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      redirect("/login?error=unverified");
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=credentials");
    }
    throw error;
  }
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
    redirect("/register?error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailOn = isEmailConfigured();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      nickname,
      role: "FAN",
      emailVerified: emailOn ? null : new Date(),
    },
  });

  if (emailOn) {
    const token = await createAuthToken(user.id, "EMAIL_VERIFY", 48);
    const link = `${appBaseUrl()}/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: "LEE YEON — 이메일 인증",
      text: `아래 링크에서 이메일을 인증해 주세요.\n\n${link}\n\n링크는 48시간 동안 유효합니다.`,
      html: `<p>아래 버튼에서 이메일을 인증해 주세요.</p><p><a href="${link}">이메일 인증하기</a></p><p>링크는 48시간 동안 유효합니다.</p>`,
    });
    redirect(`/verify-pending?email=${encodeURIComponent(email)}`);
  }

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  if (!email) redirect("/forgot-password");

  const user = await prisma.user.findUnique({ where: { email } });
  // Always redirect to the same page to avoid email enumeration.
  if (!user) {
    redirect(`/forgot-password/sent?email=${encodeURIComponent(email)}`);
  }

  const token = await createAuthToken(user.id, "PASSWORD_RESET", 2);
  const link = `${appBaseUrl()}/reset-password?token=${token}`;
  const emailed = await sendEmail({
    to: email,
    subject: "LEE YEON — 비밀번호 재설정",
    text: `비밀번호를 재설정하려면 아래 링크를 열어 주세요.\n\n${link}\n\n링크는 2시간 동안 유효합니다.`,
    html: `<p>비밀번호를 재설정하려면 아래 링크를 열어 주세요.</p><p><a href="${link}">비밀번호 재설정</a></p><p>링크는 2시간 동안 유효합니다.</p>`,
  });

  if (!emailed.ok) {
    redirect(
      `/forgot-password/sent?email=${encodeURIComponent(email)}&demo=${token}`
    );
  }

  redirect(`/forgot-password/sent?email=${encodeURIComponent(email)}`);
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token || password.length < 6 || password !== confirm) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const row = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!row) {
    redirect("/reset-password?error=expired");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: row.userId },
    data: {
      passwordHash,
      emailVerified: row.user.emailVerified || new Date(),
    },
  });

  redirect("/login?reset=1");
}

export async function verifyEmailAction(token: string): Promise<void> {
  const row = await consumeAuthToken(token, "EMAIL_VERIFY");
  if (!row) {
    redirect("/verify-email?error=expired");
  }

  await prisma.user.update({
    where: { id: row.userId },
    data: { emailVerified: new Date() },
  });

  redirect("/login?verified=1");
}

export async function resendVerifyEmailAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  if (!email || !isEmailConfigured()) {
    redirect(`/verify-pending?email=${encodeURIComponent(email)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const token = await createAuthToken(user.id, "EMAIL_VERIFY", 48);
    const link = `${appBaseUrl()}/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: "LEE YEON — 이메일 인증",
      text: `아래 링크에서 이메일을 인증해 주세요.\n\n${link}`,
      html: `<p><a href="${link}">이메일 인증하기</a></p>`,
    });
  }

  redirect(`/verify-pending?email=${encodeURIComponent(email)}&resent=1`);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(
  _prev: { ok?: boolean; error?: string },
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const bio = String(formData.get("bio") || "").trim().slice(0, 160);

  if (!name || !nickname) {
    return { error: "이름과 닉네임을 입력해 주세요." };
  }

  const taken = await prisma.user.findFirst({
    where: {
      nickname,
      id: { not: session.user.id },
    },
  });
  if (taken) {
    return { error: "이미 사용 중인 닉네임입니다." };
  }

  const image = formData.get("image");
  const uploaded = await saveUploadedImage(
    image instanceof File ? image : null,
    "avatars"
  );

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      nickname,
      bio: bio || null,
      ...(uploaded ? { image: uploaded } : {}),
    },
  });

  revalidatePath("/me");
  revalidatePath("/");
  revalidatePath("/community");
  revalidatePath("/pop");
  return { ok: true };
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
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true },
    });
    if (post && post.authorId !== session.user.id) {
      await notifyUser({
        userId: post.authorId,
        title: "새 반응",
        body: `"${post.title}"에 ${type} 반응이 달렸습니다.`,
        href: `/community/post/${postId}`,
        type: "REACTION",
      });
    }
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
    await notifyUser({
      userId: post.authorId,
      title: "새 댓글",
      body: `"${post.title}"에 댓글이 달렸습니다.`,
      href: `/community/post/${postId}`,
      type: "COMMENT",
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

  await notifyFans({
    title: "새 From 소식",
    body: body.slice(0, 80),
    href: "/from",
    type: "FROM",
    excludeUserId: session.user.id,
  });

  revalidatePath("/from");
  revalidatePath("/notifications");
  redirect("/from");
}

export async function createContentAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const category = String(formData.get("category") || "OFFICIAL").trim();
  const membershipRequired = formData.get("membershipRequired") === "on";
  if (!title || !body) redirect("/admin");

  const image = formData.get("image");
  const coverUrl = await saveUploadedImage(
    image instanceof File ? image : null,
    "contents"
  );

  const pastedVideoUrl = String(formData.get("videoUrl") || "").trim() || null;
  const clientUploadedUrl =
    String(formData.get("videoUploadedUrl") || "").trim() || null;
  const videoFile = formData.get("video");
  const serverUploadedUrl = await saveUploadedVideo(
    videoFile instanceof File ? videoFile : null,
    "videos"
  );
  const uploadedUrl = clientUploadedUrl || serverUploadedUrl || null;
  // Hybrid: prefer YouTube when a valid link is provided (cheaper + better UX).
  // Otherwise fall back to direct upload / raw mp4 URL.
  const videoUrl = getYoutubeEmbedUrl(pastedVideoUrl)
    ? pastedVideoUrl
    : uploadedUrl || pastedVideoUrl;

  const stage = await getStage();
  const content = await prisma.content.create({
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

  await notifyFans({
    title: membershipRequired ? "멤버십 콘텐츠" : "새 콘텐츠",
    body: title,
    href: `/contents/${content.id}`,
    type: "CONTENT",
    excludeUserId: session.user.id,
    membersOnly: membershipRequired,
  });

  revalidatePath("/contents");
  revalidatePath("/admin");
  revalidatePath("/notifications");
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

  const owners = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "ADMIN"] } },
    select: { id: true },
  });
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { title: true },
  });
  for (const owner of owners) {
    if (owner.id === session.user.id) continue;
    await notifyUser({
      userId: owner.id,
      title: "콘텐츠 댓글",
      body: `"${content?.title || "콘텐츠"}"에 댓글이 달렸습니다.`,
      href: `/contents/${contentId}`,
      type: "COMMENT",
    });
  }

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
  const tierLabel = String(formData.get("tierLabel") || "").trim() || null;
  const badgeColor = String(formData.get("badgeColor") || "").trim() || "#1a1a1a";
  const sortOrder = Number(formData.get("sortOrder") || 0);
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
      tierLabel,
      badgeColor,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
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
  const shopEnabled = formData.get("shopEnabled") === "on";
  if (!name) redirect("/admin");

  const hero = formData.get("hero");
  const heroUrl = await saveUploadedImage(
    hero instanceof File ? hero : null,
    "hero"
  );

  const stage = await getStage();
  await prisma.stage.update({
    where: { id: stage.id },
    data: {
      name,
      tagline,
      description,
      shopEnabled,
      ...(heroUrl ? { heroUrl } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/shop");
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

  await notifyFans({
    title: "새 일정",
    body: title,
    href: "/schedule",
    type: "SCHEDULE",
    excludeUserId: session.user.id,
  });

  revalidatePath("/schedule");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  redirect("/schedule");
}

export async function createPopRoomAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const membershipRequired = formData.get("membershipRequired") === "on";
  const live = formData.get("live") === "on";
  if (!title) redirect("/admin");

  const stage = await getStage();
  const room = await prisma.popRoom.create({
    data: {
      stageId: stage.id,
      title,
      description,
      membershipRequired,
      live,
    },
  });

  await notifyFans({
    title: live ? "POP LIVE 시작" : "새 POP",
    body: title,
    href: `/pop/${room.id}`,
    type: "POP",
    excludeUserId: session.user.id,
    membersOnly: membershipRequired,
  });

  revalidatePath("/pop");
  revalidatePath("/admin");
  revalidatePath("/notifications");
  redirect(`/pop/${room.id}`);
}

export async function togglePopLiveAction(formData: FormData): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const roomId = String(formData.get("roomId") || "").trim();
  const live = formData.get("live") === "1";
  if (!roomId) redirect("/pop");

  const room = await prisma.popRoom.findUnique({ where: { id: roomId } });
  if (!room) redirect("/pop");

  await prisma.popRoom.update({
    where: { id: roomId },
    data: { live },
  });

  if (live) {
    await notifyFans({
      title: "POP LIVE 시작",
      body: room.title,
      href: `/pop/${room.id}`,
      type: "POP",
      excludeUserId: session.user.id,
      membersOnly: room.membershipRequired,
    });
  }

  revalidatePath("/pop");
  revalidatePath(`/pop/${roomId}`);
  revalidatePath("/notifications");
  redirect(`/pop/${roomId}`);
}

export async function sendPopMessageAction(formData: FormData): Promise<void> {
  const { session, isMember, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id) redirect("/login");

  const roomId = String(formData.get("roomId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!roomId || !body) return;

  const room = await prisma.popRoom.findUnique({ where: { id: roomId } });
  if (!room) return;
  if (!room.live) return;
  if (room.membershipRequired && !isMember && !isOwner) {
    redirect("/shop/membership");
  }

  await prisma.popMessage.create({
    data: {
      roomId,
      authorId: session.user.id,
      body: body.slice(0, 500),
    },
  });

  revalidatePath(`/pop/${roomId}`);
}

export async function markNotificationReadAction(
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function updateOrderFulfillmentAction(
  formData: FormData
): Promise<void> {
  const { session, isOwner } = await getCurrentUserAccess();
  if (!session?.user?.id || !isOwner) redirect("/login");

  const orderId = String(formData.get("orderId") || "").trim();
  const fulfillmentStatus = String(
    formData.get("fulfillmentStatus") || ""
  ).trim();
  const trackingCarrier = String(formData.get("trackingCarrier") || "").trim();
  const trackingNumber = String(formData.get("trackingNumber") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const addressLine1 = String(formData.get("addressLine1") || "").trim();
  const addressLine2 = String(formData.get("addressLine2") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();

  const allowed = ["NONE", "READY", "PREPARING", "SHIPPED", "DELIVERED"];
  if (!orderId || !allowed.includes(fulfillmentStatus)) {
    redirect("/admin/orders");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect("/admin/orders");

  const prev = order.fulfillmentStatus;
  const data: {
    fulfillmentStatus: string;
    trackingCarrier: string | null;
    trackingNumber: string | null;
    adminNote: string | null;
    recipientName: string | null;
    recipientPhone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    zipCode: string | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
  } = {
    fulfillmentStatus,
    trackingCarrier: trackingCarrier || null,
    trackingNumber: trackingNumber || null,
    adminNote: adminNote || null,
    recipientName: recipientName || null,
    recipientPhone: recipientPhone || null,
    addressLine1: addressLine1 || null,
    addressLine2: addressLine2 || null,
    zipCode: zipCode || null,
  };

  if (fulfillmentStatus === "SHIPPED" && prev !== "SHIPPED") {
    data.shippedAt = new Date();
  }
  if (fulfillmentStatus === "DELIVERED") {
    data.deliveredAt = new Date();
    if (!order.shippedAt) data.shippedAt = order.shippedAt || new Date();
  }

  await prisma.order.update({ where: { id: orderId }, data });

  if (
    order.type === "PRODUCT" &&
    fulfillmentStatus !== prev &&
    ["PREPARING", "SHIPPED", "DELIVERED"].includes(fulfillmentStatus)
  ) {
    const labels: Record<string, string> = {
      PREPARING: "상품을 준비하고 있습니다",
      SHIPPED: trackingNumber
        ? `배송이 시작되었습니다 (${trackingCarrier || "택배"} ${trackingNumber})`
        : "배송이 시작되었습니다",
      DELIVERED: "배송이 완료되었습니다",
    };
    await notifyUser({
      userId: order.userId,
      title: "주문 배송 업데이트",
      body: labels[fulfillmentStatus] || "주문 상태가 변경되었습니다",
      href: `/shop/orders/${order.id}`,
      type: "ORDER",
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/me");
  revalidatePath("/notifications");
  redirect(`/admin/orders/${orderId}`);
}

export async function updateOrderAddressAction(
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orderId = String(formData.get("orderId") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const addressLine1 = String(formData.get("addressLine1") || "").trim();
  const addressLine2 = String(formData.get("addressLine2") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();

  if (!orderId || !recipientName || !recipientPhone || !addressLine1) {
    redirect(`/shop/orders/${orderId}?error=address`);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (
    !order ||
    order.userId !== session.user.id ||
    order.type !== "PRODUCT" ||
    order.status !== "PAID"
  ) {
    redirect("/me");
  }

  if (["SHIPPED", "DELIVERED"].includes(order.fulfillmentStatus)) {
    redirect(`/shop/orders/${orderId}?error=locked`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      recipientName,
      recipientPhone,
      addressLine1,
      addressLine2: addressLine2 || null,
      zipCode: zipCode || null,
    },
  });

  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath("/me");
  redirect(`/shop/orders/${orderId}?saved=1`);
}

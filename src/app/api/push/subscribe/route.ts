import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/webpush";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push not configured" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  const endpoint = String(body.endpoint || "").trim();
  const p256dh = String(body.keys?.p256dh || "").trim();
  const authKey = String(body.keys?.auth || "").trim();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) || null,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) || null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: string;
  };
  const endpoint = String(body.endpoint || "").trim();

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}

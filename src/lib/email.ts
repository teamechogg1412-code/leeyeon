import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function appBaseUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000"
  );
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!isEmailConfigured()) {
    return { ok: false as const, reason: "not_configured" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Resend error", res.status, body);
    return { ok: false as const, reason: "send_failed" as const };
  }

  return { ok: true as const };
}

export async function createAuthToken(
  userId: string,
  type: "PASSWORD_RESET" | "EMAIL_VERIFY",
  hoursValid = 2
) {
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
  await prisma.authToken.create({
    data: { userId, token, type, expiresAt },
  });
  return token;
}

export async function consumeAuthToken(
  token: string,
  type: "PASSWORD_RESET" | "EMAIL_VERIFY"
) {
  const row = await prisma.authToken.findFirst({
    where: {
      token,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!row) return null;

  await prisma.authToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  return row;
}

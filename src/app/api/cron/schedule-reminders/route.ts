import { NextRequest, NextResponse } from "next/server";
import { sendUpcomingScheduleReminders } from "@/lib/scheduleReminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const urlSecret = req.nextUrl.searchParams.get("secret");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  const ok =
    isVercelCron ||
    (secret && auth === `Bearer ${secret}`) ||
    (secret && urlSecret === secret) ||
    (!secret && process.env.NODE_ENV !== "production");

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendUpcomingScheduleReminders();
  return NextResponse.json({
    ok: true,
    ...result,
    at: new Date().toISOString(),
  });
}

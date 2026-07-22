import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { notifyFans } from "@/lib/notify";

/** Notify fans about events starting within the next 24 hours (once each). */
export async function sendUpcomingScheduleReminders(stageId?: string) {
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await prisma.scheduleEvent.findMany({
    where: {
      ...(stageId ? { stageId } : {}),
      remindedAt: null,
      startsAt: {
        gte: now,
        lte: until,
      },
    },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  let sent = 0;
  for (const event of events) {
    const when = event.allDay
      ? format(event.startsAt, "M월 d일 (EEE)", { locale: ko })
      : format(event.startsAt, "M월 d일 (EEE) HH:mm", { locale: ko });

    await notifyFans({
      title: "일정 리마인더",
      body: `${event.title} · ${when}${event.location ? ` · ${event.location}` : ""}`,
      href: "/schedule",
      type: "SCHEDULE",
    });

    await prisma.scheduleEvent.update({
      where: { id: event.id },
      data: { remindedAt: now },
    });
    sent += 1;
  }

  return { checked: events.length, sent };
}

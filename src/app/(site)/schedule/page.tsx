import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

const CATEGORY_STYLE: Record<string, string> = {
  EVENT: "bg-[#2f4a3c] text-white",
  BROADCAST: "bg-[#3a4550] text-white",
  FANMEETING: "bg-[#6b3d55] text-white",
  RELEASE: "bg-[#8b5a4a] text-white",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const stage = await getStage();
  const sp = await searchParams;
  const base = sp.ym ? new Date(`${sp.ym}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const events = await prisma.scheduleEvent.findMany({
    where: {
      stageId: stage.id,
      startsAt: {
        gte: gridStart,
        lte: new Date(gridEnd.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const prev = format(addMonths(monthStart, -1), "yyyy-MM");
  const next = format(addMonths(monthStart, 1), "yyyy-MM");
  const upcoming = events.filter((e) => e.startsAt >= new Date());

  return (
    <div className="page-shell max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="mt-1 text-sm text-muted">
            {stage.name} 공식 일정
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/schedule?ym=${prev}`}
            className="rounded-full border border-line p-2 hover:bg-black/5"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </Link>
          <p className="min-w-[8rem] text-center text-sm font-medium">
            {format(monthStart, "yyyy. M", { locale: ko })}
          </p>
          <Link
            href={`/schedule?ym=${next}`}
            className="rounded-full border border-line p-2 hover:bg-black/5"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-[#fafafa] text-center text-[11px] font-medium text-muted">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} className="px-1 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((e) =>
              isSameDay(e.startsAt, day)
            );
            const inMonth = isSameMonth(day, monthStart);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[88px] border-b border-r border-line p-1.5 ${
                  inMonth ? "bg-white" : "bg-[#f7f7f7]"
                }`}
              >
                <p
                  className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    today
                      ? "bg-black text-white"
                      : inMonth
                        ? "text-black/80"
                        : "text-black/30"
                  }`}
                >
                  {format(day, "d")}
                </p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                        CATEGORY_STYLE[event.category] || CATEGORY_STYLE.EVENT
                      }`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-muted">
                      +{dayEvents.length - 2}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-[17px] font-semibold">Upcoming</h2>
        <div className="space-y-3">
          {(upcoming.length ? upcoming : events).map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    CATEGORY_STYLE[event.category] || CATEGORY_STYLE.EVENT
                  }`}
                >
                  {event.category}
                </span>
                <time className="text-xs text-muted">
                  {event.allDay
                    ? format(event.startsAt, "M월 d일 (EEE)", { locale: ko })
                    : format(event.startsAt, "M월 d일 (EEE) HH:mm", {
                        locale: ko,
                      })}
                </time>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold">{event.title}</h3>
              {event.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {event.description}
                </p>
              )}
              {event.location && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} /> {event.location}
                </p>
              )}
            </article>
          ))}
          {events.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              등록된 일정이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

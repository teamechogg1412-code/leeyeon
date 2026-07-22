import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronRight, MapPin } from "lucide-react";

const CATEGORY_STYLE: Record<string, string> = {
  EVENT: "bg-[#2f4a3c] text-white",
  BROADCAST: "bg-[#3a4550] text-white",
  FANMEETING: "bg-[#6b3d55] text-white",
  RELEASE: "bg-[#8b5a4a] text-white",
};

type WeekEvent = {
  id: string;
  title: string;
  location: string | null;
  category: string;
  startsAt: Date;
  allDay: boolean;
};

export function HomeWeekSchedule({
  days,
  events,
}: {
  days: Date[];
  events: WeekEvent[];
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-[17px] font-semibold">This Week</h2>
          <p className="mt-0.5 text-xs text-muted">다가오는 7일 일정</p>
        </div>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-black"
        >
          Full calendar <ChevronRight size={14} />
        </Link>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.startsAt, day));
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`w-[132px] shrink-0 rounded-2xl border px-3 py-3 ${
                today
                  ? "border-black/20 bg-black/[0.03]"
                  : "border-line bg-surface"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                {format(day, "EEE", { locale: ko })}
              </p>
              <p
                className={`mt-1 text-lg font-semibold ${
                  today ? "text-black" : "text-black/80"
                }`}
              >
                {format(day, "d")}
                <span className="ml-0.5 text-xs font-normal text-muted">
                  {format(day, "M월", { locale: ko })}
                </span>
              </p>
              <div className="mt-3 space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-[11px] text-muted">일정 없음</p>
                ) : (
                  dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id}>
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                          CATEGORY_STYLE[event.category] || CATEGORY_STYLE.EVENT
                        }`}
                      >
                        {event.category}
                      </span>
                      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {event.allDay
                          ? "종일"
                          : format(event.startsAt, "HH:mm")}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  ))
                )}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-muted">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length > 0 && (
        <div className="mt-4 space-y-2">
          {events.slice(0, 4).map((event) => (
            <Link
              key={event.id}
              href="/schedule"
              className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:bg-black/[0.015]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                      CATEGORY_STYLE[event.category] || CATEGORY_STYLE.EVENT
                    }`}
                  >
                    {event.category}
                  </span>
                  <time className="text-[11px] text-muted">
                    {format(event.startsAt, "M/d (EEE)", { locale: ko })}
                    {!event.allDay &&
                      ` ${format(event.startsAt, "HH:mm")}`}
                  </time>
                </div>
                <p className="mt-1 text-sm font-medium">{event.title}</p>
              </div>
              {event.location && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted">
                  <MapPin size={11} /> {event.location}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

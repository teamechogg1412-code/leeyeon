"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Search, ShoppingBag, UserRound } from "lucide-react";

const navAll = [
  { href: "/", label: "Home" },
  { href: "/from", label: "From Yeon" },
  { href: "/contents", label: "Contents" },
  { href: "/community", label: "Community" },
  { href: "/pop", label: "POP" },
  { href: "/schedule", label: "Schedule" },
  { href: "/shop", label: "Shop" },
];

export function SiteHeaderClient({
  stageName,
  isLoggedIn,
  isOwner,
  shopEnabled = true,
  unreadCount = 0,
  logoutAction,
}: {
  stageName: string;
  isLoggedIn: boolean;
  isOwner: boolean;
  shopEnabled?: boolean;
  unreadCount?: number;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const nav = shopEnabled
    ? navAll
    : navAll.filter((item) => item.href !== "/shop");

  return (
    <header
      className={
        isHome
          ? "absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-gradient-to-b from-black/45 to-transparent"
          : "sticky top-0 z-40 border-b border-black/8 bg-white/90 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className={
            isHome
              ? "font-[family-name:var(--font-display)] text-lg font-semibold tracking-[0.04em] text-white"
              : "font-[family-name:var(--font-display)] text-lg font-semibold tracking-[0.04em]"
          }
        >
          {stageName}
        </Link>

        <nav
          className={
            isHome
              ? "hidden items-center gap-7 text-[13px] tracking-wide text-white md:flex"
              : "hidden items-center gap-7 text-[13px] tracking-wide text-black/55 md:flex"
          }
        >
          {nav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isHome
                    ? isActive
                      ? "font-semibold text-white"
                      : "text-white transition hover:opacity-80"
                    : isActive
                      ? "font-semibold text-black"
                      : "transition hover:text-black"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className={
              isHome
                ? "rounded-full p-2 text-white hover:bg-white/10"
                : "rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
            }
            aria-label="Search"
          >
            <Search size={18} />
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/schedule"
                className={
                  isHome
                    ? "rounded-full p-2 text-white hover:bg-white/10"
                    : "rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                }
                aria-label="Schedule"
              >
                <CalendarDays size={18} />
              </Link>
              <Link
                href="/notifications"
                className={
                  isHome
                    ? "relative rounded-full p-2 text-white hover:bg-white/10"
                    : "relative rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                }
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c81e1e] px-1 text-[9px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              {shopEnabled && (
                <Link
                  href="/shop"
                  className={
                    isHome
                      ? "rounded-full p-2 text-white hover:bg-white/10"
                      : "rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                  }
                  aria-label="Shop"
                >
                  <ShoppingBag size={18} />
                </Link>
              )}
              <Link
                href="/me"
                className={
                  isHome
                    ? "rounded-full p-2 text-white hover:bg-white/10"
                    : "rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                }
                aria-label="Profile"
              >
                <UserRound size={18} />
              </Link>
              {isOwner && (
                <Link
                  href="/admin"
                  className={
                    isHome
                      ? "ml-1 hidden rounded-full border border-white/25 px-3 py-1.5 text-xs font-medium text-white sm:inline-flex"
                      : "ml-1 hidden rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium sm:inline-flex"
                  }
                >
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={
                    isHome
                      ? "rounded-full px-3 py-1.5 text-xs text-white hover:opacity-80"
                      : "rounded-full px-3 py-1.5 text-xs text-black/50 hover:text-black"
                  }
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/schedule"
                className={
                  isHome
                    ? "rounded-full p-2 text-white hover:bg-white/10"
                    : "rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                }
                aria-label="Schedule"
              >
                <CalendarDays size={18} />
              </Link>
              {shopEnabled && (
                <Link
                  href="/shop"
                  className={
                    isHome
                      ? "rounded-full p-2 text-white hover:bg-white/10"
                      : "rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                  }
                  aria-label="Shop"
                >
                  <ShoppingBag size={18} />
                </Link>
              )}
              <Link
                href="/login"
                className={
                  isHome
                    ? "rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-black"
                    : "rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white"
                }
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        className={
          isHome
            ? "flex gap-5 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs text-white md:hidden"
            : "flex gap-5 overflow-x-auto border-t border-black/5 px-4 py-2 text-xs text-black/55 md:hidden"
        }
      >
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

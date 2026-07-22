"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserRound } from "lucide-react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/from", label: "From Yeon" },
  { href: "/contents", label: "Contents" },
  { href: "/community", label: "Community" },
  { href: "/shop", label: "Shop" },
];

export function SiteHeaderClient({
  stageName,
  isLoggedIn,
  isOwner,
  logoutAction,
}: {
  stageName: string;
  isLoggedIn: boolean;
  isOwner: boolean;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[0.04em]"
        >
          {stageName}
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] tracking-wide text-black/55 md:flex">
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
                  isActive
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
          {isLoggedIn ? (
            <>
              <Link
                href="/notifications"
                className="rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              <Link
                href="/me"
                className="rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
                aria-label="Profile"
              >
                <UserRound size={18} />
              </Link>
              {isOwner && (
                <Link
                  href="/admin"
                  className="ml-1 hidden rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium sm:inline-flex"
                >
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-xs text-black/50 hover:text-black"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      <nav className="flex gap-5 overflow-x-auto border-t border-black/5 px-4 py-2 text-xs text-black/55 md:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

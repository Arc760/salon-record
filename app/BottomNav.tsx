"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./useLanguage";

const text = {
  zh: {
    home: "首页",
    menu: "菜单",
    employees: "员工",
    reports: "报表",
  },
  en: {
    home: "Home",
    menu: "Menu",
    employees: "Employees",
    reports: "Reports",
  },
};

const navItems = [
  { href: "/", key: "home" as const },
  { href: "/services", key: "menu" as const },
  { href: "/employees", key: "employees" as const },
  { href: "/reports", key: "reports" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = text[language];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center justify-center rounded-xl px-2 text-xs font-semibold ${
                active ? "bg-gray-900 text-white" : "text-gray-600"
              }`}
            >
              {t[item.key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

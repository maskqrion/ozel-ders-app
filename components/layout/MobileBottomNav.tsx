"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: profile } = useProfile();

  const homeHref = profile?.role === "ogrenci" ? "/ogrenci" : "/hoca";

  const links = [
    { href: homeHref, label: "Ana Sayfa", icon: Home },
    { href: "/profil", label: "Profil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-safe pt-2 h-16 z-50">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
              active ? "text-primary" : "text-gray-400"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

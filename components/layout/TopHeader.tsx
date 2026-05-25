"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useProfile } from "@/lib/hooks/useProfile";
import NotificationBell from "@/components/dashboard/shared/NotificationBell";

function LogoIcon() {
  return (
    <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 grid place-items-center shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm font-extrabold tracking-tight text-slate-800 hidden sm:block"
      >
        Özel Ders
      </motion.span>
    </Link>
  );
}

export default function TopHeader() {
  const { data: profile } = useProfile();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-3 flex justify-between items-center relative">
      <Link href="/profil" className="flex items-center gap-2 min-w-0">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name ?? "Profil"}
            width={32}
            height={32}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-600 text-sm font-semibold">
              {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 truncate">
          {profile?.full_name ?? profile?.email ?? ""}
        </span>
      </Link>

      <LogoIcon />

      {profile?.id && <NotificationBell userId={profile.id} />}
    </header>
  );
}

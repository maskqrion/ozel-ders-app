"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

// ── Context ────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <Sidebar>");
  return ctx;
}

// ── Sidebar ────────────────────────────────────────────────────────────────

interface SidebarProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}

export function Sidebar({
  children,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  animate = true,
}: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ── SidebarBody ────────────────────────────────────────────────────────────

interface SidebarBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarBody({ children, className }: SidebarBodyProps) {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
}

// ── Desktop Sidebar ────────────────────────────────────────────────────────

function DesktopSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        "hidden md:flex h-full flex-col px-4 py-5 shrink-0 overflow-hidden",
        className
      )}
      style={{
        background: "#100904",
        borderRight: "1px solid #40372e",
      }}
      animate={{ width: animate ? (open ? "240px" : "64px") : "240px" }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.div>
  );
}

// ── Mobile Sidebar ─────────────────────────────────────────────────────────

function MobileSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = useSidebar();

  return (
    <div
      className={cn(
        "md:hidden flex flex-row items-center justify-between px-4 py-3 w-full",
        className
      )}
      style={{
        background: "#100904",
        borderBottom: "1px solid #40372e",
      }}
    >
      {/* Hamburger */}
      <button
        type="button"
        aria-label="Menüyü aç"
        onClick={() => setOpen(!open)}
        className="z-20"
        style={{ color: "#ffedd7" }}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="h-5 w-5">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[100] flex flex-col px-6 py-5"
            style={{
              background: "#100904",
              borderRight: "1px solid #40372e",
              width: "260px",
            }}
          >
            {/* Close */}
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setOpen(false)}
              className="self-end mb-6"
              style={{ color: "#6c5f51" }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="h-5 w-5">
                <path d="M5 5l10 10M15 5l-10 10" />
              </svg>
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SidebarLink ────────────────────────────────────────────────────────────

interface SidebarLinkProps {
  link: LinkItem;
  className?: string;
}

export function SidebarLink({ link, className }: SidebarLinkProps) {
  const { open, animate } = useSidebar();

  return (
    <a
      href={link.href}
      className={cn(
        "group/link flex items-center gap-3 py-2 px-2 rounded-[8px] transition-colors duration-200",
        className
      )}
      style={{
        color: "#6c5f51",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#ffedd7";
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,237,215,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#6c5f51";
        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
      }}
    >
      {/* Icon — always visible */}
      <span className="shrink-0 h-5 w-5 flex items-center justify-center" style={{ color: "inherit" }}>
        {link.icon}
      </span>

      {/* Label — fades in when open */}
      <AnimatePresence>
        {(animate ? open : true) && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden whitespace-nowrap"
            style={{
              fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.33,
              color: "inherit",
            }}
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Burnt-sienna hairline accent on hover — right edge */}
      <motion.span
        className="ml-auto shrink-0 h-4 w-px rounded-full opacity-0 group-hover/link:opacity-100 transition-opacity duration-200"
        style={{ background: "#dc5000" }}
        aria-hidden
      />
    </a>
  );
}

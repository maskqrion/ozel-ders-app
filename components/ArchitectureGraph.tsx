"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { NodeObject, LinkObject } from "react-force-graph-2d";

// ── Types ─────────────────────────────────────────────────────────────────────
type NodeType = "center" | "main" | "sub";

interface AppNode extends NodeObject {
  id: string;
  label: string;
  nodeType: NodeType;
}

// ── Graph Data ────────────────────────────────────────────────────────────────
const NODES: AppNode[] = [
  // Center
  { id: "center",    label: "Özel Ders Pro",          nodeType: "center" },

  // Main nodes
  { id: "supabase",  label: "Veritabanı\n(Supabase)", nodeType: "main" },
  { id: "wallet",    label: "Cüzdan",                 nodeType: "main" },
  { id: "chat",      label: "Gerçek Zamanlı\nChat",   nodeType: "main" },
  { id: "frontend",  label: "Next.js\nFrontend",      nodeType: "main" },
  { id: "design",    label: "Tasarım Sistemi\n(ORYZO)", nodeType: "main" },
  { id: "auth",      label: "Kimlik\nDoğrulama",      nodeType: "main" },
  { id: "push",      label: "Push\nBildirimler",      nodeType: "main" },

  // Supabase children
  { id: "db-users",       label: "users",             nodeType: "sub" },
  { id: "db-lessons",     label: "lessons",           nodeType: "sub" },
  { id: "db-assignments", label: "assignments",       nodeType: "sub" },
  { id: "db-wallets",     label: "wallets",           nodeType: "sub" },
  { id: "db-messages",    label: "messages",          nodeType: "sub" },
  { id: "db-rls",         label: "RLS Policies",      nodeType: "sub" },

  // Wallet children
  { id: "w-panel",   label: "CuzdanPanel",            nodeType: "sub" },
  { id: "w-tx",      label: "wallet_transactions",    nodeType: "sub" },
  { id: "w-load",    label: "Bakiye Yükle",           nodeType: "sub" },

  // Chat children
  { id: "c-msg",     label: "Mesajlar.tsx",           nodeType: "sub" },
  { id: "c-rt",      label: "Supabase Realtime",      nodeType: "sub" },
  { id: "c-bell",    label: "NotificationBell",       nodeType: "sub" },

  // Frontend children
  { id: "fe-auth",   label: "app/(auth)",             nodeType: "sub" },
  { id: "fe-dash",   label: "app/(dashboard)",        nodeType: "sub" },
  { id: "fe-sand",   label: "app/sandbox",            nodeType: "sub" },
  { id: "fe-davet",  label: "app/davet",              nodeType: "sub" },

  // Design children
  { id: "ds-css",    label: "globals.css",            nodeType: "sub" },
  { id: "ds-black",  label: "studio-black",           nodeType: "sub" },
  { id: "ds-cream",  label: "warm-cream",             nodeType: "sub" },
  { id: "ds-sienna", label: "burnt-sienna",           nodeType: "sub" },

  // Auth children
  { id: "a-login",   label: "login/page.tsx",         nodeType: "sub" },
  { id: "a-trigger", label: "auth_sync_trigger",      nodeType: "sub" },
  { id: "a-client",  label: "supabase/client.ts",     nodeType: "sub" },

  // Push children
  { id: "p-mgr",     label: "PushManager.tsx",        nodeType: "sub" },
  { id: "p-bell",    label: "NotificationBell.tsx",   nodeType: "sub" },
  { id: "p-api",     label: "Web Push API",           nodeType: "sub" },
];

const LINKS: { source: string; target: string }[] = [
  // center → mains
  { source: "center", target: "supabase" },
  { source: "center", target: "wallet" },
  { source: "center", target: "chat" },
  { source: "center", target: "frontend" },
  { source: "center", target: "design" },
  { source: "center", target: "auth" },
  { source: "center", target: "push" },
  // supabase → subs
  { source: "supabase", target: "db-users" },
  { source: "supabase", target: "db-lessons" },
  { source: "supabase", target: "db-assignments" },
  { source: "supabase", target: "db-wallets" },
  { source: "supabase", target: "db-messages" },
  { source: "supabase", target: "db-rls" },
  // wallet → subs
  { source: "wallet", target: "w-panel" },
  { source: "wallet", target: "w-tx" },
  { source: "wallet", target: "w-load" },
  // chat → subs
  { source: "chat", target: "c-msg" },
  { source: "chat", target: "c-rt" },
  { source: "chat", target: "c-bell" },
  // frontend → subs
  { source: "frontend", target: "fe-auth" },
  { source: "frontend", target: "fe-dash" },
  { source: "frontend", target: "fe-sand" },
  { source: "frontend", target: "fe-davet" },
  // design → subs
  { source: "design", target: "ds-css" },
  { source: "design", target: "ds-black" },
  { source: "design", target: "ds-cream" },
  { source: "design", target: "ds-sienna" },
  // auth → subs
  { source: "auth", target: "a-login" },
  { source: "auth", target: "a-trigger" },
  { source: "auth", target: "a-client" },
  // push → subs
  { source: "push", target: "p-mgr" },
  { source: "push", target: "p-bell" },
  { source: "push", target: "p-api" },
  // cross-links
  { source: "db-messages", target: "c-rt" },
  { source: "db-wallets",  target: "w-tx" },
  { source: "a-client",    target: "supabase" },
  { source: "p-bell",      target: "c-bell" },
];

// ── Visual constants ──────────────────────────────────────────────────────────
const NODE_R: Record<NodeType, number> = { center: 13, main: 8, sub: 4.5 };

const NODE_FILL: Record<NodeType, string> = {
  center: "#dc5000",
  main:   "#ffedd7",
  sub:    "#40372e",
};

const LABEL_COLOR: Record<NodeType, string> = {
  center: "#dc5000",
  main:   "#ffedd7",
  sub:    "rgba(255,237,215,0.55)",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ArchitectureGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paintNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, scale: number) => {
      const n = node as AppNode;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const r = NODE_R[n.nodeType];
      const isHov = hovered === n.id;

      // Glow
      if (n.nodeType === "center" || isHov) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
        const glowColor = n.nodeType === "center"
          ? "rgba(220,80,0,0.30)"
          : "rgba(255,237,215,0.12)";
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, r * 2.8, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Pulse ring on center
      if (n.nodeType === "center") {
        ctx.beginPath();
        ctx.arc(x, y, r + 4 / scale, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(220,80,0,0.25)";
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isHov ? "#ff7a38" : NODE_FILL[n.nodeType];
      ctx.fill();

      if (n.nodeType !== "sub") {
        ctx.strokeStyle = n.nodeType === "center"
          ? "rgba(255,122,56,0.7)"
          : "rgba(255,237,215,0.25)";
        ctx.lineWidth = 1.2 / scale;
        ctx.stroke();
      }

      // Label
      const fSize = n.nodeType === "center" ? 11 : n.nodeType === "main" ? 9 : 7.5;
      const fs = fSize / scale;
      ctx.font = `${n.nodeType === "center" ? "600 " : ""}${fs}px "Plus Jakarta Sans", ui-sans-serif, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHov ? "#ffedd7" : LABEL_COLOR[n.nodeType];

      const lines = n.label.split("\n");
      const lh = (fSize + 1.5) / scale;
      const ly = y + r + 3.5 / scale;
      lines.forEach((line, i) => ctx.fillText(line, x, ly + i * lh));
    },
    [hovered]
  );

  const paintPointerArea = useCallback(
    (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as AppNode;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, NODE_R[n.nodeType] + 5, 0, 2 * Math.PI);
      ctx.fill();
    },
    []
  );

  const getLinkColor = useCallback(
    (link: LinkObject) => {
      const l = link as { source: AppNode; target: AppNode };
      if (l.source?.nodeType === "center" || l.target?.nodeType === "center") {
        return "rgba(220,80,0,0.35)";
      }
      return "rgba(255,237,215,0.08)";
    },
    []
  );

  const getLinkWidth = useCallback(
    (link: LinkObject) => {
      const l = link as { source: AppNode; target: AppNode };
      if (l.source?.nodeType === "center" || l.target?.nodeType === "center") return 1.5;
      return 0.7;
    },
    []
  );

  const onNodeHover = useCallback((node: NodeObject | null) => {
    setHovered(node ? (node as AppNode).id : null);
    if (typeof document !== "undefined") {
      document.body.style.cursor = node ? "pointer" : "default";
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {size.w > 0 && (
        <ForceGraph2D
          graphData={{ nodes: NODES, links: LINKS }}
          width={size.w}
          height={size.h}
          backgroundColor="#100904"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={paintPointerArea}
          nodeLabel={() => ""}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          onNodeHover={onNodeHover}
          cooldownTicks={150}
          d3AlphaDecay={0.012}
          d3VelocityDecay={0.28}
          enableZoomInteraction
          enablePanInteraction
        />
      )}
    </div>
  );
}

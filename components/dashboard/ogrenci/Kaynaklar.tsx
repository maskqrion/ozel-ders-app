"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Resource } from "@/lib/types";
import { CardSpotlight } from "@/components/ui/card-spotlight";

type Props = {
  kaynaklar: Resource[];
};

export default function Kaynaklar({ kaynaklar }: Props) {
  if (kaynaklar.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-slate-200 bg-white p-4 text-slate-500"
      >
        Henüz kaynak yüklenmedi.
      </motion.p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AnimatePresence initial={false}>
        {kaynaklar.map((k, i) => (
          <motion.div
            key={k.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, delay: i * 0.02 }}
          >
            <CardSpotlight
              bg="white"
              color="rgba(59,130,246,0.10)"
              borderColor="#e2e8f0"
              hoverBorderColor="rgba(59,130,246,0.35)"
              radius={280}
              className="block"
            >
              <a
                href={k.signed_url || "#"}
                onClick={(e) => {
                  if (!k.signed_url) e.preventDefault();
                }}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4"
              >
                <div className="rounded-lg bg-blue-50 p-2 text-blue-500">📄</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{k.title}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Tıkla ve Görüntüle</p>
                </div>
              </a>
            </CardSpotlight>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

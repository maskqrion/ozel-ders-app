"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "framer-motion";
import { useState } from "react";

const loadFeatures = () => import("framer-motion").then((mod) => mod.domMax);

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <LazyMotion features={loadFeatures}>{children}</LazyMotion>
    </QueryClientProvider>
  );
}

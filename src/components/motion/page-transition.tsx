"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isFirstPaint = useRef(true);

  useEffect(() => {
    isFirstPaint.current = false;
  }, []);

  const skipEnter = reduceMotion || isFirstPaint.current;

  return (
    <motion.div
      key={pathname}
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      initial={skipEnter ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease }}
    >
      {children}
    </motion.div>
  );
}

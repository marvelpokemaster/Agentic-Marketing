"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollSceneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  showDivider?: boolean;
}

export function ScrollScene({
  id,
  children,
  className = "",
  showDivider = true,
}: ScrollSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "-100px", once: false });

  return (
    <div id={id} ref={ref} className="relative z-10 w-full">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 12 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`min-h-[85vh] flex flex-col justify-center py-16 md:py-28 ${className}`}
      >
        {children}
      </motion.section>

      {showDivider && (
        <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-60" />
        </div>
      )}
    </div>
  );
}

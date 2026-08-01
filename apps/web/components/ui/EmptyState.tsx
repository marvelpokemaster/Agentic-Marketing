"use client";

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-panel px-6 py-20 text-center">
      {icon && <div className="mb-5 text-muted">{icon}</div>}
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 mb-7 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action}
    </div>
  );
}

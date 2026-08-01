import React from "react";

export type CodeLineTone = "comment" | "command" | "output" | "ok" | "warn" | "err" | "dim";

export interface CodeLine {
  tone?: CodeLineTone;
  text: string;
  /** Optional right-aligned annotation, e.g. a duration or count. */
  meta?: string;
}

interface CodePanelProps {
  title?: string;
  lines: CodeLine[];
  className?: string;
}

const TONE_CLASS: Record<CodeLineTone, string> = {
  comment: "text-ink-muted",
  command: "text-ink-text",
  output: "text-ink-text/80",
  ok: "text-[#8fc98f]",
  warn: "text-[#dcb072]",
  err: "text-[#e08a78]",
  dim: "text-ink-muted",
};

/**
 * Near-black terminal surface. Static markup — no canvas, no animation loop.
 * Colours are fixed rather than theme-derived so the panel reads as a
 * terminal in both light and dark mode, the way the reference design does.
 */
export function CodePanel({ title, lines, className = "" }: CodePanelProps) {
  return (
    <div className={`ink overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 border-b border-ink-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-border" />
        {title && (
          <span className="ml-2 truncate font-mono text-[11px] text-ink-muted">{title}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <pre className="min-w-max px-4 py-4 font-mono text-[12.5px] leading-[1.85]">
          {lines.map((line, i) => (
            <div key={i} className="flex items-baseline gap-4">
              <span className={TONE_CLASS[line.tone || "output"]}>
                {line.tone === "command" && <span className="text-[#8fc98f]">$ </span>}
                {line.text || " "}
              </span>
              {line.meta && (
                <span className="ml-auto shrink-0 pl-6 text-ink-muted">{line.meta}</span>
              )}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

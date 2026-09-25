"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopy } from "./helpers";

// ─── Copy button with check feedback ─────────────────────────────────────

export function CopyButton({
  text,
  label,
  className,
  title,
}: {
  text: string;
  label?: string;
  className?: string;
  title?: string;
}) {
  const { copied, copy } = useCopy();

  if (label) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("min-h-9 gap-1.5", className)}
        onClick={() => void copy(text)}
        aria-label={title ?? "Copy to clipboard"}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copied" : label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8 shrink-0", className)}
      onClick={() => void copy(text)}
      aria-label={title ?? "Copy to clipboard"}
      title={title ?? "Copy to clipboard"}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}

// ─── Dark code block with optional file header + copy ────────────────────

export function CodeBlock({
  code,
  fileName,
  language,
  maxHeight = "420px",
  className,
}: {
  code: string;
  fileName?: string;
  language?: string;
  maxHeight?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
        <span className="min-w-0 truncate font-mono text-xs text-zinc-300">
          {fileName ?? language ?? "code"}
        </span>
        <CopyButton
          text={code}
          className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          title="Copy code"
        />
      </div>
      <pre
        className="thin-scrollbar overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-100"
        style={{ maxHeight }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { scoreHex } from "./helpers";

// Animated SVG score ring / gauge. Color: emerald ≥80, amber ≥60, red below.

export function ScoreRing({
  value,
  size = 168,
  stroke = 13,
  label = "SEO score",
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const color = scoreHex(clamped);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(clamped)} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          className="text-foreground/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color }}
        >
          {Math.round(clamped)}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

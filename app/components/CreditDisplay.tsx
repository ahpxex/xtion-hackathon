"use client";

import { useAtom } from "jotai";
import { clickCountAtom, displayUpgradeLevelAtom } from "../store/atoms";

interface CreditDisplayProps {
  size?: "sm" | "m" | "l" | "xl" | "huge";
}

export default function CreditDisplay({ size = "m" }: CreditDisplayProps) {
  const [clickCount] = useAtom(clickCountAtom);
  const [displayLevel] = useAtom(displayUpgradeLevelAtom);

  if (clickCount === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-sm",
    m: "text-2xl",
    l: "text-4xl",
    xl: "text-6xl",
    huge: "text-8xl",
  };

  const clampedLevel = Math.min(Math.max(displayLevel, 0), 5);
  switch (clampedLevel) {
    case 0:
      size = "sm";
      break;
    case 1:
      size = "m";
      break;
    case 2:
      size = "l";
      break;
    case 3:
      size = "l";
      break;
    case 4:
      size = "xl";
    case 5:
      size = "huge";
      break;
    default:
      break;
  }

  const levelClasses = [
    "text-slate-900",
    "text-slate-900 drop-shadow-[0_0_8px_rgba(59,130,246,0.25)] transition-transform duration-200",
    "bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 text-transparent bg-clip-text drop-shadow-[0_0_12px_rgba(99,102,241,0.45)] transition-transform duration-200",
    "bg-gradient-to-r from-emerald-300 via-cyan-400 to-violet-500 text-transparent bg-clip-text drop-shadow-[0_0_14px_rgba(56,189,248,0.45)] animate-gradient-slow transition-transform duration-200 hover:scale-[1.03]",
    "bg-[radial-gradient(circle_at_top_left,#fef08a,transparent_55%),radial-gradient(circle_at_bottom_right,#a78bfa,transparent_45%)] text-transparent bg-clip-text drop-shadow-[0_0_16px_rgba(129,140,248,0.55)] animate-gradient-slow transition-transform duration-200 hover:scale-[1.05] hover:-rotate-1",
    "relative text-transparent bg-[conic-gradient(from_90deg,#f97316,#f43f5e,#8b5cf6,#38bdf8,#f97316)] bg-clip-text drop-shadow-[0_0_18px_rgba(249,115,22,0.55)] animate-hue-bounce transition-transform duration-200 hover:scale-[1.07] hover:rotate-1",
  ];

  const levelWrapperClasses = [
    "",
    "",
    "",
    "group inline-flex items-center gap-2",
    "group inline-flex items-center gap-3 relative",
    "group inline-flex items-center gap-3 relative",
  ];

  const prefixSparkle =
    clampedLevel >= 4 ? (
      <span className="text-amber-300 text-lg animate-sparkle">✦</span>
    ) : null;

  const suffixSparkle =
    clampedLevel >= 4 ? (
      <span
        className="text-sky-200 text-lg animate-sparkle"
        style={{ animationDelay: "0.6s" }}
      >
        ✦
      </span>
    ) : null;

  return (
    <div className={levelWrapperClasses[clampedLevel]}>
      {prefixSparkle}
      <p
        className={`${sizeClasses[size]} font-bold ${
          levelClasses[clampedLevel]
        } ${
          clampedLevel >= 5
            ? "hover:shadow-[0_0_24px_rgba(248,113,113,0.55)]"
            : ""
        }`}
      >
        点数：{clickCount.toLocaleString()}
      </p>
      {suffixSparkle}
    </div>
  );
}

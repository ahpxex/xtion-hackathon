'use client';

import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  leaderboardAtom,
  LeaderboardEntry,
  showLeaderboardAtom,
  leaderboardStyleLevelAtom,
  leaderboardBoostUntilAtom,
  leaderboardComedownUntilAtom,
} from '../store/atoms';

interface LeaderboardDynamics {
  boostActive: boolean;
  comedownActive: boolean;
  styleLevel: number;
}

function trendFromDelta(delta: number): LeaderboardEntry['trend'] {
  if (delta > 25) return 'up';
  if (delta < -25) return 'down';
  return 'steady';
}

function generateUpdatedEntries(
  entries: LeaderboardEntry[],
  dynamics: LeaderboardDynamics
): LeaderboardEntry[] {
  const { boostActive, comedownActive, styleLevel } = dynamics;
  const variance = 110 + styleLevel * 20;

  const updated = entries.map((entry) => {
    const basePoints = entry.points;
    let delta = Math.floor(Math.random() * variance) - Math.floor(variance / 2);

    if (entry.id === 'player') {
      if (boostActive) {
        delta = Math.round(240 + styleLevel * 80 + Math.random() * 90);
      } else if (comedownActive) {
        delta = -Math.round(210 + Math.random() * 120 + styleLevel * 40);
      } else {
        delta = Math.round((Math.random() - 0.45) * (95 + styleLevel * 25));
      }
    } else {
      if (boostActive) {
        delta -= Math.round(Math.random() * (70 + styleLevel * 25));
      } else if (comedownActive) {
        delta += Math.round(Math.random() * (55 + styleLevel * 18));
      }
    }

    const nextPoints = Math.max(basePoints + delta, 0);

    return {
      ...entry,
      points: nextPoints,
      delta,
      trend: trendFromDelta(delta),
    };
  });

  const playerIndex = updated.findIndex((entry) => entry.id === 'player');

  if (playerIndex >= 0) {
    const previousPoints = entries[playerIndex].points;

    if (boostActive) {
      const othersMax = Math.max(
        ...updated
          .filter((_, idx) => idx !== playerIndex)
          .map((entry) => entry.points)
      );
      const boostedPoints = othersMax + 200 + styleLevel * 70;
      updated[playerIndex] = {
        ...updated[playerIndex],
        points: boostedPoints,
        delta: boostedPoints - previousPoints,
        trend: 'up',
      };
    } else if (comedownActive) {
      const othersPoints = updated
        .filter((_, idx) => idx !== playerIndex)
        .map((entry) => entry.points)
        .sort((a, b) => a - b);
      const median = othersPoints[Math.floor(othersPoints.length / 2)] ?? 0;
      const droppedPoints = Math.max(
        median - (150 + styleLevel * 45 + Math.random() * 70),
        0
      );
      updated[playerIndex] = {
        ...updated[playerIndex],
        points: droppedPoints,
        delta: droppedPoints - previousPoints,
        trend: 'down',
      };
    }
  }

  return updated
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function getContainerClass(styleLevel: number): string {
  const base =
    'fixed top-4 left-4 z-[9990] w-72 overflow-hidden rounded-2xl pointer-events-auto transition-all duration-500';

  if (styleLevel >= 5) {
    return (
      `${base} bg-gradient-to-br from-slate-950/85 via-indigo-900/60 to-fuchsia-900/55 text-indigo-100 ` +
      'border border-indigo-300/40 shadow-[0_0_70px_rgba(129,140,248,0.75)] backdrop-blur-xl ring-4 ring-indigo-300/35'
    );
  }

  if (styleLevel >= 3) {
    return (
      `${base} bg-gradient-to-br from-slate-900/85 via-indigo-950/55 to-purple-900/55 text-indigo-100 ` +
      'border border-indigo-400/45 shadow-[0_0_50px_rgba(99,102,241,0.55)] backdrop-blur-lg'
    );
  }

  if (styleLevel >= 1) {
    return (
      `${base} bg-gradient-to-br from-white via-slate-50 to-indigo-100 text-slate-900 ` +
      'border border-indigo-200/70 shadow-[0_0_28px_rgba(96,165,250,0.25)]'
    );
  }

  return `${base} bg-white text-slate-900 border-2 border-slate-900 shadow-md`;
}

function getHeaderClass(styleLevel: number): string {
  const base = 'flex items-center justify-between px-3 py-2 transition-all duration-500';
  if (styleLevel >= 5) {
    return `${base} bg-white/10 border-b border-indigo-200/30 backdrop-blur-xl`;
  }
  if (styleLevel >= 3) {
    return `${base} bg-white/10 border-b border-indigo-200/40 backdrop-blur`;
  }
  if (styleLevel >= 1) {
    return `${base} bg-indigo-50/70 border-b border-indigo-200/60`;
  }
  return `${base} bg-slate-100 border-b-2 border-slate-900`;
}

function getListClass(styleLevel: number): string {
  const base = 'p-3 space-y-2 font-mono text-sm transition-colors duration-500';
  if (styleLevel >= 3) {
    return `${base} text-indigo-100/90`;
  }
  return `${base} text-slate-800`;
}

function getStatusBadgeClass(
  isDark: boolean,
  boostActive: boolean,
  comedownActive: boolean
): string {
  const base = 'text-[10px] tracking-[0.32em] uppercase font-semibold';
  if (boostActive) {
    return `${base} text-emerald-300 animate-pulse`;
  }
  if (comedownActive) {
    return `${base} text-rose-300`;
  }
  return `${base} ${isDark ? 'text-indigo-200/70' : 'text-slate-500'}`;
}

export default function Leaderboard() {
  const [showLeaderboard] = useAtom(showLeaderboardAtom);
  const [entries] = useAtom(leaderboardAtom);
  const [styleLevel] = useAtom(leaderboardStyleLevelAtom);
  const [boostUntil] = useAtom(leaderboardBoostUntilAtom);
  const [comedownUntil] = useAtom(leaderboardComedownUntilAtom);
  const setEntries = useSetAtom(leaderboardAtom);
  const [phase, setPhase] = useState<'boost' | 'comedown' | 'steady'>('steady');

  useEffect(() => {
    if (!showLeaderboard) {
      return undefined;
    }

    let timeoutId: number | null = null;
    let active = true;

    const schedule = () => {
      const baseDelay = Math.max(1500, 2600 - styleLevel * 190);
      const variance = Math.max(480, 900 - styleLevel * 140);
      const delay = baseDelay + Math.random() * variance;

      timeoutId = window.setTimeout(() => {
        if (!active) return;
        tick();
      }, delay);
    };

    const tick = () => {
      const now = Date.now();
      const boostActive = boostUntil > now;
      const comedownActive = !boostActive && comedownUntil > now;

      setEntries((prev) =>
        generateUpdatedEntries(prev, { boostActive, comedownActive, styleLevel })
      );

      setPhase(boostActive ? 'boost' : comedownActive ? 'comedown' : 'steady');

      schedule();
    };

    // 立即执行一次以响应最新状态
    tick();

    return () => {
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [showLeaderboard, setEntries, boostUntil, comedownUntil, styleLevel]);

  if (!showLeaderboard) {
    return null;
  }

  const boostActive = phase === 'boost';
  const comedownActive = phase === 'comedown';
  const isDark = styleLevel >= 3;

  const containerClass = getContainerClass(styleLevel);
  const headerClass = getHeaderClass(styleLevel);
  const listClass = getListClass(styleLevel);
  const statusBadgeClass = getStatusBadgeClass(isDark, boostActive, comedownActive);

  const gaugeAccent = styleLevel >= 4 ? 'from-indigo-400/80 to-cyan-300/80' : 'from-indigo-400/60 to-sky-300/60';

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex items-center gap-2 uppercase tracking-wide text-xs font-semibold">
          <span className="text-base">🏆</span>
          <span>排行榜</span>
          <span
            className={`rounded-full px-2 py-[1px] text-[10px] font-bold ${
              isDark ? 'border border-indigo-200/60 text-indigo-100' : 'border border-indigo-400/60 text-indigo-600'
            }`}
          >
            Lv.{styleLevel}
          </span>
        </div>
        <span className={statusBadgeClass}>
          {boostActive ? '冲榜中' : comedownActive ? '回落中' : '实时' }
        </span>
      </div>

      <ul className={listClass}>
        {entries.map((entry) => {
          const isPlayer = entry.id === 'player';
          const trendSymbol = entry.trend === 'up' ? '▲' : entry.trend === 'down' ? '▼' : '—';
          const deltaLabel = entry.delta > 0 ? `+${entry.delta}` : entry.delta < 0 ? `${entry.delta}` : '±0';
          const topPoints = entries[0]?.points ?? 1;
          const widthPercent = Math.min(100, Math.max(8, (entry.points / topPoints) * 100));

          let itemClass = 'flex items-center justify-between gap-2 px-3 py-2 border rounded-xl transition-all duration-500 backdrop-blur-sm';
          if (isDark) {
            itemClass += ' border-white/10 bg-white/5 text-indigo-100/90';
          } else {
            itemClass += ' border-slate-900 bg-white';
          }

          if (styleLevel >= 2 && !isPlayer) {
            itemClass = itemClass.replace('bg-white', 'bg-white/80');
          }

          if (isPlayer) {
            if (boostActive) {
              itemClass += ' animate-pulse border-indigo-200/70 bg-indigo-500/25 shadow-[0_0_32px_rgba(99,102,241,0.5)] scale-[1.02]';
            } else if (comedownActive) {
              itemClass += ' border-rose-400/70 bg-rose-500/15 shadow-[0_0_20px_rgba(248,113,113,0.4)]';
            } else if (styleLevel >= 3) {
              itemClass += ' border-indigo-300/60 bg-indigo-500/20 shadow-[0_0_24px_rgba(129,140,248,0.35)]';
            } else {
              itemClass += ' border-indigo-300/60 bg-indigo-100/60';
            }
          }

          const deltaClass = isDark
            ? entry.trend === 'up'
              ? 'text-emerald-300'
              : entry.trend === 'down'
              ? 'text-rose-300'
              : 'text-indigo-200/70'
            : entry.trend === 'up'
            ? 'text-emerald-600'
            : entry.trend === 'down'
            ? 'text-rose-600'
            : 'text-slate-500';

          return (
            <li key={entry.id} className={itemClass}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-6 ${isDark ? 'text-indigo-100/80' : 'text-slate-800'}`}>
                  #{entry.rank}
                </span>
                <div>
                  <div className={`text-sm font-semibold uppercase tracking-wide ${isPlayer ? '' : ''}`}>
                    {entry.name}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-indigo-200/80' : 'text-slate-600'}`}>
                    {entry.points.toLocaleString()} pts
                  </div>
                </div>
              </div>
              <div className={`flex flex-col items-end text-xs font-bold ${deltaClass}`}>
                <span>{trendSymbol} {deltaLabel}</span>
                <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full bg-gradient-to-r ${gaugeAccent}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

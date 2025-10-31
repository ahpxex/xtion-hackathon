'use client';

import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { leaderboardAtom, LeaderboardEntry, showLeaderboardAtom } from '../store/atoms';

function generateUpdatedEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const updated = entries.map(entry => {
    const delta = Math.floor(Math.random() * 120) - 40; // -40 到 +79 的波动
    const newPoints = Math.max(entry.points + delta, 0);

    let trend: LeaderboardEntry['trend'] = 'steady';
    if (delta > 20) {
      trend = 'up';
    } else if (delta < -20) {
      trend = 'down';
    }

    return {
      ...entry,
      points: newPoints,
      delta,
      trend,
    };
  });

  return updated
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export default function Leaderboard() {
  const [showLeaderboard] = useAtom(showLeaderboardAtom);
  const [entries] = useAtom(leaderboardAtom);
  const setEntries = useSetAtom(leaderboardAtom);

  useEffect(() => {
    if (!showLeaderboard) {
      return undefined;
    }

    let timeoutId: number | null = null;
    let isActive = true;
    const scheduleUpdate = () => {
      const delay = 2500 + Math.random() * 2000;
      timeoutId = window.setTimeout(() => {
        if (!isActive) {
          return;
        }
        setEntries(prev => generateUpdatedEntries(prev));
        scheduleUpdate();
      }, delay);
    };

    scheduleUpdate();

    return () => {
      isActive = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [setEntries, showLeaderboard]);

  if (!showLeaderboard) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-[9990] w-72 bg-white text-slate-900 border-2 border-slate-900 shadow-md">
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-slate-900 bg-slate-100">
        <div className="flex items-center gap-2 uppercase tracking-wide text-sm font-semibold">
          <span className="text-base">🏆</span>
          <span>排行榜</span>
        </div>
        <span className="text-[10px] tracking-wide text-slate-500">Live</span>
      </div>

      <ul className="p-3 space-y-2 font-mono text-sm">
        {entries.map(entry => {
          const deltaLabel =
            entry.delta > 0
              ? `+${entry.delta}`
              : entry.delta < 0
              ? `${entry.delta}`
              : '±0';
          const trendColor =
            entry.trend === 'up'
              ? 'text-emerald-600'
              : entry.trend === 'down'
              ? 'text-rose-600'
              : 'text-slate-500';

          return (
            <li
              key={entry.id}
              className="flex items-center justify-between border border-slate-900 px-2 py-2 bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800 w-6">
                  #{entry.rank}
                </span>
                <div>
                  <div className="text-sm font-semibold uppercase">{entry.name}</div>
                  <div className="text-xs text-slate-600">
                    {entry.points.toLocaleString()} pts
                  </div>
                </div>
              </div>
              <div className={`text-xs font-bold ${trendColor}`}>
                {deltaLabel}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

'use client';

import { useAtom } from 'jotai';
import { stageAtom, showStageIndicatorAtom } from '../store/atoms';
import {
  getLevelFromStage,
  getLevelProgress,
  getLevelColor,
  getLevelGradient,
  getLevelText
} from '../utils/levelSystem';

export default function StageIndicator() {
  const [stage] = useAtom(stageAtom);
  const [showStageIndicator] = useAtom(showStageIndicatorAtom);

  if (!showStageIndicator) {
    return null;
  }

  // 使用新的 level 系统
  const level = getLevelFromStage(stage);
  const progress = getLevelProgress(stage);
  const levelColor = getLevelColor(level);
  const levelGradient = getLevelGradient(level);
  const levelText = getLevelText(level);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9997]">
      <div className="bg-white rounded-full shadow-xl border-2 border-gray-300 px-6 py-3 min-w-80">
        {/* Level 显示 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="font-bold text-lg">Level</span>
            <span className={`font-bold text-2xl ${levelColor}`}>
              {level}
            </span>
          </div>
          <span className={`text-sm font-semibold ${levelColor}`}>
            {levelText}
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${levelGradient}`}
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <div className="h-full flex items-center justify-end pr-2">
                <span className="text-xs text-white font-bold">
                  {progress.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

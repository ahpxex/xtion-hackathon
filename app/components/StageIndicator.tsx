'use client';

import { useAtom } from 'jotai';
import { stageAtom, showStageIndicatorAtom } from '../store/atoms';

export default function StageIndicator() {
  const [stage] = useAtom(stageAtom);
  const [showStageIndicator] = useAtom(showStageIndicatorAtom);

  if (!showStageIndicator) {
    return null;
  }

  // 计算进度百分比
  const progress = (stage / 1000) * 100;

  // 根据阶段显示不同的颜色
  const getStageColor = () => {
    if (stage === 0) return 'text-gray-500';
    if (stage < 250) return 'text-green-600';
    if (stage < 500) return 'text-blue-600';
    if (stage < 750) return 'text-purple-600';
    return 'text-red-600';
  };

  // 根据阶段显示不同的状态文字
  const getStageText = () => {
    if (stage === 0) return '游戏未开始';
    if (stage < 250) return '初级阶段';
    if (stage < 500) return '进阶阶段';
    if (stage < 750) return '高级阶段';
    if (stage < 1000) return '终极阶段';
    return '游戏完成';
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9997]">
      <div className="bg-white rounded-full shadow-xl border-2 border-gray-300 px-6 py-3 min-w-80">
        {/* 阶段显示 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="font-bold text-lg">Stage</span>
            <span className={`font-bold text-2xl ${getStageColor()}`}>
              {stage}
            </span>
            <span className="text-gray-400 text-sm">/1000</span>
          </div>
          <span className={`text-sm font-semibold ${getStageColor()}`}>
            {getStageText()}
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              stage === 0
                ? 'bg-gray-400'
                : stage < 250
                ? 'bg-gradient-to-r from-green-400 to-green-600'
                : stage < 500
                ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                : stage < 750
                ? 'bg-gradient-to-r from-purple-400 to-purple-600'
                : 'bg-gradient-to-r from-red-400 to-red-600'
            }`}
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

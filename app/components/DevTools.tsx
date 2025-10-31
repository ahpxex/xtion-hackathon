'use client';

import { useAtom } from 'jotai';
import { clickCountAtom, stageAtom } from '../store/atoms';
import { useState } from 'react';

export default function DevTools() {
  const [clickCount, setClickCount] = useAtom(clickCountAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const [isOpen, setIsOpen] = useState(false);

  const addPoints = (amount: number) => {
    setClickCount(prev => prev + amount);
    setStage(prev => prev + amount);
  };

  const resetState = () => {
    setClickCount(0);
    setStage(0);
  };

  return (
    <div className="fixed top-4 right-4 z-[10000]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-mono"
        >
          Dev Tools
        </button>
      ) : (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-xl border border-gray-600 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Dev Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Current State */}
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">Current State</div>
              <div className="font-mono text-sm">
                <div>Points: {clickCount}</div>
                <div>Stage: {stage}</div>
              </div>
            </div>

            {/* Quick Add Points */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Quick Add Points</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addPoints(100)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  +100
                </button>
                <button
                  onClick={() => addPoints(1000)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  +1K
                </button>
                <button
                  onClick={() => addPoints(10000)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  +10K
                </button>
              </div>
            </div>

            {/* Reset */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Reset</div>
              <button
                onClick={resetState}
                className="w-full bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm transition-colors"
              >
                Reset Points & Stage
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

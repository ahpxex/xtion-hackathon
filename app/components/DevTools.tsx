'use client';

import { useAtom } from 'jotai';
import { clickCountAtom, stageAtom } from '../store/atoms';
import { useState } from 'react';

export default function DevTools() {
  const [clickCount, setClickCount] = useAtom(clickCountAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const addPoints = (amount: number) => {
    setClickCount(prev => prev + amount);
  };

  const setPoints = (amount: number) => {
    setClickCount(amount);
  };

  const setStageValue = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1000, value));
    setStage(clampedValue);
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

            {/* Custom Amount */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Custom Amount</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const amount = parseInt(customAmount);
                    if (!isNaN(amount)) {
                      addPoints(amount);
                      setCustomAmount('');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Set Points */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Set Points Directly</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPoints(0)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setPoints(1000)}
                  className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  1K
                </button>
                <button
                  onClick={() => setPoints(10000)}
                  className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  10K
                </button>
              </div>
            </div>

            {/* Set Stage */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Set Stage (0-1000)</div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setStageValue(0)}
                  className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  0
                </button>
                <button
                  onClick={() => setStageValue(250)}
                  className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  250
                </button>
                <button
                  onClick={() => setStageValue(500)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  500
                </button>
                <button
                  onClick={() => setStageValue(1000)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm transition-colors"
                >
                  1000
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

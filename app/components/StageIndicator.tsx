'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import {
  finaleModeAtom,
  stageAtom,
  showStageIndicatorAtom
} from '../store/atoms';
import {
  getLevelFromStage,
  getLevelProgress,
  getLevelColor,
  getLevelGradient,
  getLevelText
} from '../utils/levelSystem';

const FINAL_STAGE_THRESHOLD = 3000;
const FINAL_VIDEO_DELAY_MS = 1200;

export default function StageIndicator() {
  const stage = useAtomValue(stageAtom);
  const showStageIndicator = useAtomValue(showStageIndicatorAtom);
  const [finaleMode, setFinaleMode] = useAtom(finaleModeAtom);
  const [showFinalVideo, setShowFinalVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (stage >= FINAL_STAGE_THRESHOLD && !finaleMode) {
      setFinaleMode(true);
    }
  }, [stage, finaleMode, setFinaleMode]);

  useEffect(() => {
    if (!finaleMode) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowFinalVideo(true);
    }, FINAL_VIDEO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [finaleMode]);

  useEffect(() => {
    if (showFinalVideo && videoRef.current) {
      const video = videoRef.current;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Final video autoplay failed:', error);
        });
      }
    }
  }, [showFinalVideo]);

  if (!showStageIndicator && !finaleMode) {
    return null;
  }

  const level = getLevelFromStage(stage);
  const progress = getLevelProgress(stage);
  const levelColor = getLevelColor(level);
  const levelGradient = getLevelGradient(level);
  const levelText = getLevelText(level);

  const containerClassName = finaleMode
    ? 'fixed inset-0 z-[12000] transition-all duration-1000 ease-in-out pointer-events-none flex items-center justify-center'
    : 'fixed top-4 left-1/2 -translate-x-1/2 z-[12000] transition-all duration-500 ease-out pointer-events-none';

  const panelClassName = finaleMode
    ? 'relative flex flex-col items-center justify-center w-screen h-screen bg-black rounded-none border-none shadow-none pointer-events-auto overflow-hidden transition-all duration-1000 ease-in-out'
    : 'relative flex flex-col items-center justify-center bg-white rounded-full shadow-xl border-2 border-gray-300 px-6 py-3 min-w-80 pointer-events-auto overflow-hidden transition-all duration-500 ease-out';

  return (
    <div className={containerClassName}>
      <div className={panelClassName}>
        <div
          className={`relative z-10 w-full max-w-md transition-opacity duration-700 ease-in-out ${
            showFinalVideo ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
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

        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            showFinalVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="/background.mp4"
            autoPlay
            controls={false}
            playsInline
          />
        </div>
      </div>
    </div>
  );
}

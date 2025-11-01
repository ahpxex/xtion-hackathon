"use client";

import { useAtomValue } from "jotai";
import { showAbstractVideoAtom } from "../store/atoms";
import { useEffect, useRef } from "react";

export default function AbstractVideoDisplay() {
  const showVideo = useAtomValue(showAbstractVideoAtom);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      const video = videoRef.current;
      void video.play().catch((err) => {
        console.warn("自动播放抽象视频失败:", err);
      });
    }
  }, [showVideo]);

  if (!showVideo) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9000] shadow-2xl rounded-xl overflow-hidden bg-black/40">
      <video
        ref={videoRef}
        className="h-120 object-cover"
        src="/abstract.mp4"
        autoPlay
        loop
        playsInline
        onPause={() => {
          const video = videoRef.current;
          if (video && !video.ended) {
            void video.play().catch(() => {});
          }
        }}
        onEnded={() => {
          const video = videoRef.current;
          if (video) {
            video.currentTime = 0;
            void video.play().catch(() => {});
          }
        }}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { toastsAtom, showFloatingPanelAtom } from "../store/atoms";
import Toast from "./Toast";
import Image from "next/image";
import { ServerMessage, subscribeToGameSocket } from "../utils/websocketClient";
import { addToast } from "../utils/toastHelpers";

function deriveToastType(state?: string) {
  if (!state) {
    return "info" as const;
  }

  const normalized = state.toUpperCase();
  if (normalized.includes("ERROR")) return "error" as const;
  if (normalized.includes("WARN")) return "warning" as const;
  if (normalized.includes("SUCCESS") || normalized.includes("OK")) {
    return "success" as const;
  }
  return "info" as const;
}

function extractPayload(message: ServerMessage) {
  const data = (message.data as Record<string, unknown> | undefined) ?? undefined;

  const stateCandidate = typeof data?.state === "string" ? data?.state : message.state;
  const messageCandidate =
    typeof data?.message === "string"
      ? data?.message
      : typeof message.message === "string"
      ? message.message
      : undefined;

  return {
    state: stateCandidate,
    text: messageCandidate,
  };
}

interface FloatingPanelProps {
  defaultPosition?: { x: number; y: number };
}

export default function FloatingPanel({ defaultPosition }: FloatingPanelProps) {
  const [toasts, setToasts] = useAtom(toastsAtom);
  const [showFloatingPanel] = useAtom(showFloatingPanelAtom);

  // 所有 hooks 必须在条件判断之前调用
  const [position, setPosition] = useState(
    defaultPosition || {
      x: window.innerWidth - 150,
      y: window.innerHeight - 150,
    }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousToastCountRef = useRef(0);

  useEffect(() => {
    if (!defaultPosition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition({
        x: window.innerWidth - 150,
        y: window.innerHeight - 150,
      });
    }
  }, [defaultPosition]);

  // 监听后端 WebSocket 消息并将其转换为 toast
  useEffect(() => {
    if (!showFloatingPanel) {
      return undefined;
    }

    const unsubscribe = subscribeToGameSocket((serverMessage) => {
      if (!serverMessage) {
        return;
      }

      const { state, text } = extractPayload(serverMessage);
      const toastText = text && text.trim().length > 0 ? text : "收到来自服务器的消息";
      const toastType = deriveToastType(state);

      setToasts((prevToasts) => addToast(prevToasts, toastText, toastType).toasts);
    });

    return () => {
      unsubscribe();
    };
  }, [setToasts, showFloatingPanel]);


  // 监听 toast 数量变化，当有新 toast 时随机移动面板
  useEffect(() => {
    const moveToRandomPosition = () => {
      if (!panelRef.current) return;

      const panelWidth = panelRef.current.offsetWidth;
      const panelHeight = panelRef.current.offsetHeight;

      // 计算可用空间
      const maxX = window.innerWidth - panelWidth;
      const maxY = window.innerHeight - panelHeight;

      // 确保至少有 50px 的边距
      const minX = 50;
      const minY = 50;
      const safeMaxX = Math.max(minX, maxX - 50);
      const safeMaxY = Math.max(minY, maxY - 50);

      // 生成随机位置
      const newX = Math.random() * (safeMaxX - minX) + minX;
      const newY = Math.random() * (safeMaxY - minY) + minY;

      setIsAnimating(true);
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });

      // 动画结束后重置状态
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    };
    if (toasts.length > previousToastCountRef.current && !isDragging) {
      // 有新 toast 添加，触发随机移动
      moveToRandomPosition();
    }
    previousToastCountRef.current = toasts.length;
  }, [toasts.length, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // 边界检查
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 0);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 条件判断必须在所有 hooks 之后
  if (!showFloatingPanel) {
    return null;
  }

  return (
    <>
      {/* Toast 容器 - 显示在面板上方 */}
      <div
        className="fixed flex flex-col-reverse gap-2 pointer-events-none z-[9999]"
        style={{
          left: `${position.x}px`,
          bottom: `${window.innerHeight - position.y + 16}px`,
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </div>

      {/* 圆形通知图标 */}
      <div
        ref={panelRef}
        className={`fixed bg-transparent rounded-full flex items-center justify-center z-[9998] ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${
          isAnimating ? "transition-all duration-300 ease-in-out" : ""
        } `}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "60px",
          height: "60px",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 通知图标 */}
        <div className="relative flex items-center justify-center">
          <Image
            src="/moscot.png"
            alt="AI 通知面板"
            width={44}
            height={44}
            className="select-none pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
            priority
          />
          {/* 通知数量徽章 */}
          {toasts.length > 0 && (
            <div className="absolute text-2xl -top-2 -right-2 bg-red-500 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center animate-pulse">
              {toasts.length}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

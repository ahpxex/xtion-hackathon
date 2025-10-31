'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { useAtom } from 'jotai';
import { toastsAtom, showFloatingPanelAtom } from '../store/atoms';
import Toast from './Toast';

interface FloatingPanelProps {
  defaultPosition?: { x: number; y: number };
}

export default function FloatingPanel({
  defaultPosition,
}: FloatingPanelProps) {
  const [toasts, setToasts] = useAtom(toastsAtom);
  const [showFloatingPanel] = useAtom(showFloatingPanelAtom);

  if (!showFloatingPanel) {
    return null;
  }
  const [position, setPosition] = useState(
    defaultPosition || { x: window.innerWidth - 150, y: window.innerHeight - 150 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousToastCountRef = useRef(0);

  useEffect(() => {
    if (!defaultPosition) {
      setPosition({
        x: window.innerWidth - 150,
        y: window.innerHeight - 150,
      });
    }
  }, [defaultPosition]);

  // 模拟随机弹出消息
  useEffect(() => {
    const messages = [
      { type: 'info' as const, text: '系统运行正常' },
      { type: 'success' as const, text: '数据同步成功' },
      { type: 'warning' as const, text: '内存使用率较高' },
      { type: 'error' as const, text: '连接超时' },
      { type: 'info' as const, text: '有新的更新可用' },
      { type: 'success' as const, text: '备份完成' },
      { type: 'warning' as const, text: '磁盘空间不足' },
      { type: 'info' as const, text: '收到新消息' },
    ];

    const randomInterval = () => {
      return Math.random() * 4000 + 2000; // 2-6秒之间随机
    };

    const scheduleNextToast = () => {
      const timer = setTimeout(() => {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        setToasts((toasts) => {
          const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          return [
            ...toasts,
            {
              id,
              message: randomMessage.text,
              type: randomMessage.type,
              duration: 3000,
            },
          ];
        });

        scheduleNextToast();
      }, randomInterval());

      return timer;
    };

    const timer = scheduleNextToast();

    return () => clearTimeout(timer);
  }, [setToasts]);

  // 监听 toast 数量变化，当有新 toast 时随机移动面板
  useEffect(() => {
    if (toasts.length > previousToastCountRef.current && !isDragging) {
      // 有新 toast 添加，触发随机移动
      moveToRandomPosition();
    }
    previousToastCountRef.current = toasts.length;
  }, [toasts.length, isDragging]);

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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

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
        className={`fixed bg-gray-500 rounded-full shadow-2xl flex items-center justify-center z-[9998] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${isAnimating ? 'transition-all duration-300 ease-in-out' : ''} hover:bg-gray-600`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '100px',
          height: '100px',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 通知图标 */}
        <div className="relative">
          <span className="text-5xl">🔔</span>
          {/* 通知数量徽章 */}
          {toasts.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {toasts.length}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

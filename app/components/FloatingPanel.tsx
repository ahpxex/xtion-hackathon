'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { useAtom } from 'jotai';
import { toastsAtom } from '../store/atoms';
import Toast from './Toast';

interface FloatingPanelProps {
  children?: ReactNode;
  defaultPosition?: { x: number; y: number };
  title?: string;
}

export default function FloatingPanel({
  children,
  defaultPosition,
  title = '浮动面板',
}: FloatingPanelProps) {
  const [toasts] = useAtom(toastsAtom);
  const [position, setPosition] = useState(
    defaultPosition || { x: window.innerWidth - 320, y: window.innerHeight - 200 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousToastCountRef = useRef(0);

  useEffect(() => {
    if (!defaultPosition) {
      setPosition({
        x: window.innerWidth - 320,
        y: window.innerHeight - 200,
      });
    }
  }, [defaultPosition]);

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

      {/* 浮动面板 */}
      <div
        ref={panelRef}
        className={`fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 overflow-hidden z-[9998] ${
          isDragging ? 'cursor-grabbing' : ''
        } ${isAnimating ? 'transition-all duration-300 ease-in-out' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          minWidth: '280px',
          maxWidth: '400px',
        }}
      >
        {/* 可拖动的标题栏 */}
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 cursor-grab active:cursor-grabbing flex items-center justify-between"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>

        {/* 面板内容 */}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}

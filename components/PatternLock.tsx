"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface Point {
  x: number;
  y: number;
  id: number;
}

interface PatternLockProps {
  onComplete: (pattern: string) => void;
  size?: number;
  error?: boolean;
}

export default function PatternLock({ onComplete, size = 300, error }: PatternLockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [activeIds, setActiveIds] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

  // Initialize dots in a 3x3 grid
  const dots = useMemo(() => {
    const temp = [];
    const step = size / 4;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        temp.push({
          id: row * 3 + col,
          x: (col + 1) * step,
          y: (row + 1) * step
        });
      }
    }
    return temp;
  }, [size]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setActiveIds([]);
    updatePosition(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    updatePosition(e);
  };

  const handleEnd = () => {
    if (activeIds.length > 0) {
      onComplete(activeIds.join(""));
    }
    setIsDrawing(false);
    setMousePos(null);
  };

  const updatePosition = (e: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setMousePos({ x, y });

    // Check if we hit a dot
    dots.forEach(dot => {
      const dist = Math.sqrt(Math.pow(dot.x - x, 2) + Math.pow(dot.y - y, 2));
      if (dist < 30 && !activeIds.includes(dot.id)) {
        setActiveIds(prev => [...prev, dot.id]);
        
        // Haptic feedback if available
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative select-none touch-none mx-auto"
      style={{ width: size, height: size }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Draw lines between active dots */}
        {activeIds.map((id, index) => {
          if (index === 0) return null;
          const prev = dots[activeIds[index - 1]];
          const curr = dots[id];
          return (
            <motion.line
              key={`line-${index}`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              x1={prev.x}
              y1={prev.y}
              x2={curr.x}
              y2={curr.y}
              stroke={error ? "#ef4444" : "#10b981"}
              strokeWidth="6"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          );
        })}

        {/* Draw line to current mouse position */}
        {isDrawing && activeIds.length > 0 && mousePos && (
          <line
            x1={dots[activeIds[activeIds.length - 1]].x}
            y1={dots[activeIds[activeIds.length - 1]].y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke={error ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}
            strokeWidth="4"
            strokeDasharray="8 4"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Draw Dots */}
      <div className="absolute inset-0 grid grid-cols-3 gap-0">
        {dots.map((dot) => {
          const isActive = activeIds.includes(dot.id);
          return (
            <div 
              key={dot.id}
              className="flex items-center justify-center relative"
              style={{ width: size / 3, height: size / 3 }}
            >
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.5 : 1,
                  backgroundColor: isActive ? (error ? "#ef4444" : "#10b981") : "#e2e8f0"
                }}
                className="w-4 h-4 rounded-full shadow-inner relative z-10"
              />
              {isActive && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 0.2 }}
                  className={`absolute w-10 h-10 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

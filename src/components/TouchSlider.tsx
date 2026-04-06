'use client';

import { useRef, useCallback } from 'react';

interface Props {
  value: number; // 0~1
  onChange: (value: number) => void;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  thumbSize?: number;
  height?: number;
}

/**
 * 터치 + 마우스 드래그 가능한 슬라이더
 */
export default function TouchSlider({
  value,
  onChange,
  trackColor = '#3f3f46',
  fillColor = '#ffffff',
  thumbColor = '#ffffff',
  thumbSize = 14,
  height = 4,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getPercent = useCallback((clientX: number) => {
    if (!barRef.current) return value;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, [value]);

  const handleStart = useCallback((clientX: number) => {
    dragging.current = true;
    onChange(getPercent(clientX));
  }, [onChange, getPercent]);

  const handleMove = useCallback((clientX: number) => {
    if (!dragging.current) return;
    onChange(getPercent(clientX));
  }, [onChange, getPercent]);

  const handleEnd = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={barRef}
      className="relative cursor-pointer touch-none"
      style={{ height: thumbSize + 8, display: 'flex', alignItems: 'center' }}
      onClick={(e) => onChange(getPercent(e.clientX))}
      onMouseDown={(e) => { handleStart(e.clientX); const move = (ev: MouseEvent) => handleMove(ev.clientX); const up = () => { handleEnd(); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* 트랙 */}
      <div className="w-full rounded-full relative" style={{ height, background: trackColor }}>
        {/* 채움 */}
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: fillColor }} />
        {/* 썸 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-md"
          style={{
            width: thumbSize,
            height: thumbSize,
            background: thumbColor,
            left: `calc(${value * 100}% - ${thumbSize / 2}px)`,
          }}
        />
      </div>
    </div>
  );
}

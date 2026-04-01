'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export default function LyricsView() {
  const { currentTrack, currentLineIndex } = usePlayerStore();
  const { seekTo } = useAudioPlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 자동 스크롤
  useEffect(() => {
    if (currentLineIndex < 0 || !lineRefs.current[currentLineIndex]) return;

    lineRefs.current[currentLineIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [currentLineIndex]);

  if (!currentTrack) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🎙️</div>
          <p className="text-lg">트랙을 선택해주세요</p>
          <p className="text-sm mt-1">좌측 플레이리스트에서 재생할 항목을 클릭하세요</p>
        </div>
      </div>
    );
  }

  const lines = currentTrack.content.lines;

  const handleLineClick = (time: number) => {
    seekTo(time);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-white text-lg font-semibold">{currentTrack.title}</h2>
        <p className="text-gray-400 text-sm mt-1">
          {currentTrack.category} · {currentTrack.date}
        </p>
      </div>

      {/* 내용 영역 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth"
      >
        <div className="max-w-2xl mx-auto space-y-1">
          {lines.map((line, index) => {
            const isActive = index === currentLineIndex;
            const isPast = index < currentLineIndex;

            return (
              <button
                key={index}
                ref={(el) => { lineRefs.current[index] = el; }}
                onClick={() => handleLineClick(line.time)}
                className={`
                  block w-full text-left py-2.5 px-4 rounded-lg transition-all duration-300 cursor-pointer
                  ${isActive
                    ? 'text-white text-lg font-semibold bg-emerald-500/10 scale-[1.02]'
                    : isPast
                      ? 'text-gray-500 text-base'
                      : 'text-gray-400 text-base hover:text-gray-300'
                  }
                `}
              >
                {isActive && (
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                )}
                {line.text}
              </button>
            );
          })}
        </div>

        {/* 하단 여백 (플레이어 바 높이만큼) */}
        <div className="h-24" />
      </div>
    </div>
  );
}

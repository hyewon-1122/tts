'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const MOOD_MIRROR_URL = 'https://ip-10-0-0-11.taile4e502.ts.net/mood-mirror/';
const MOOD_EMOJIS = ['😊', '😌', '🤔', '😤', '🥺', '😎', '🤩', '😴', '🥳', '😰', '💪', '🙃', '😇', '🫠', '✨'];

export default function BriefingPage() {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [emoji, setEmoji] = useState('😊');

  // 랜덤 이모지 순환
  useEffect(() => {
    if (loaded) return;
    const interval = setInterval(() => {
      setEmoji(MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]);
    }, 800);
    return () => clearInterval(interval);
  }, [loaded]);

  // iframe 로딩이 오래 걸리거나 실패하면 재시도 UI 노출
  useEffect(() => {
    setLoaded(false);
    setLoadError(null);

    const timeoutMs = 12000;
    const timer = setTimeout(() => {
      setLoadError('무드미러를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [reloadKey]);

  return (
    <div className="h-full bg-black relative">
      {/* 로딩 애니메이션 */}
      {!loaded && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          <div className="relative w-20 h-20 mb-6">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid #BEFF00' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid #BEFF00' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={emoji}
                className="text-3xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {emoji}
              </motion.span>
            </div>
          </div>
          <motion.p
            className="text-sm font-medium text-white mb-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            오늘 기분 어떤가요?
          </motion.p>
          <p className="text-xs text-zinc-500">무드 미러를 불러오고 있어요</p>
        </div>
      )}

      {/* 실패/타임아웃 시 재시도 화면 */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black px-6 text-center">
          <p className="text-sm font-medium text-white mb-2">연결이 원활하지 않아요</p>
          <p className="text-xs text-zinc-500 mb-6">{loadError}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-white text-black"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-zinc-900 text-white border border-zinc-700"
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      <iframe
        key={reloadKey}
        src={MOOD_MIRROR_URL}
        className="w-full h-full border-none"
        onLoad={() => {
          setLoaded(true);
          setLoadError(null);
        }}
        onError={() => setLoadError('무드미러 서버 응답이 지연되거나(예: 502) 연결에 실패했어요.')}
        allow="autoplay"
      />
    </div>
  );
}

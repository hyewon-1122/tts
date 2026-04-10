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
  const [forceFail, setForceFail] = useState(false);

  // 랜덤 이모지 순환
  useEffect(() => {
    if (loaded) return;
    const interval = setInterval(() => {
      setEmoji(MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]);
    }, 800);
    return () => clearInterval(interval);
  }, [loaded]);

  // 확인용: URL에 ?mm_fail=1 이면 실패 화면 강제 노출
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      setForceFail(sp.get('mm_fail') === '1');
    } catch {
      setForceFail(false);
    }
  }, []);

  // iframe 로딩이 오래 걸리거나 실패하면 재시도 UI 노출
  useEffect(() => {
    setLoaded(false);
    setLoadError(null);

    if (forceFail) {
      setLoadError('확인용 강제 실패 모드예요. (?mm_fail=1)');
      return;
    }

    const timeoutMs = 12000;
    const timer = setTimeout(() => {
      setLoadError('무드미러를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [reloadKey, forceFail]);

  return (
    <div className="h-full bg-black relative flex flex-col">
      {/* 상단 타이틀 */}
      <div className="flex-shrink-0 bg-black z-20 px-4 pt-8 pb-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪞</span>
          <h1 className="text-xl font-bold text-white">무드미러</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">오늘 기분에 맞는 투자 브리핑을 들어보세요</p>
      </div>

      {/* iframe 영역 */}
      <div className="flex-1 relative">
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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/70 p-6 text-center relative overflow-hidden">
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(190, 255, 0, 0.22), transparent 70%)' }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}
              >
                <svg viewBox="0 0 24 24" fill="#000" className="w-6 h-6">
                  <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1H5.02A7 7 0 0 0 19 13c0-3.87-3.13-7-7-7z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold mb-1" style={{ color: '#BEFF00' }}>
                머니터링 Pick
              </h1>
              <p className="text-[9px] text-zinc-500 tracking-wider uppercase mb-4">MOOD MIRROR</p>
              <p className="text-sm font-semibold text-white mb-2">무드미러 연결이 원활하지 않아요</p>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6 whitespace-pre-line">{loadError}</p>

              <div className="flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-zinc-900 border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <iframe
        key={reloadKey}
        src={forceFail ? `${MOOD_MIRROR_URL}__force_fail__` : MOOD_MIRROR_URL}
        className="w-full h-full border-none"
        onLoad={() => {
          setLoaded(true);
          setLoadError(null);
        }}
        onError={() => setLoadError('무드미러 서버 응답이 지연되거나(예: 502) 연결에 실패했어요.')}
        allow="autoplay"
      />
      </div>
    </div>
  );
}

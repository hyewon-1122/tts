'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const MOOD_MIRROR_URL = 'https://ip-10-0-0-11.taile4e502.ts.net/mood-mirror/';

export default function BriefingPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="h-full bg-black relative">
      {/* 로딩 애니메이션 */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          {/* 펄스 원 */}
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
                className="text-3xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                🪞
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
      <iframe
        src={MOOD_MIRROR_URL}
        className="w-full h-full border-none"
        onLoad={() => setLoaded(true)}
        allow="autoplay"
      />
    </div>
  );
}

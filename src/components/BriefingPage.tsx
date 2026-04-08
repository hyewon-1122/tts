'use client';

import { useState } from 'react';

const MOOD_MIRROR_URL = 'https://ip-10-0-0-11.taile4e502.ts.net/mood-mirror/';

export default function BriefingPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="h-full bg-black relative">
      {/* 로딩 스피너 */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin w-6 h-6 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
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

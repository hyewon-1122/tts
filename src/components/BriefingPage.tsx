'use client';

import { useEffect, useState } from 'react';

const MOOD_MIRROR_URL = 'https://ip-10-0-0-11.taile4e502.ts.net/mood-mirror/';

export default function BriefingPage() {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proxy?url=${encodeURIComponent(MOOD_MIRROR_URL)}`)
      .then((r) => r.ok ? r.text() : '')
      .then((h) => { setHtml(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="animate-spin w-6 h-6 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center px-8">
          <div className="text-5xl mb-4">🪞</div>
          <p className="text-base font-semibold text-white mb-2">브리핑을 불러올 수 없어요</p>
          <p className="text-sm text-zinc-400">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  // Vercel 프록시를 통해 가져온 HTML을 iframe srcdoc으로 렌더
  return (
    <div className="h-full bg-black">
      <iframe
        srcDoc={html}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Plus, Upload, X, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Short {
  id: string;
  title: string;
  videoUrl: string;
  date: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadShorts = useCallback(async () => {
    try {
      const res = await apiFetch('/api/shorts');
      if (res.ok) {
        const data: Short[] = await res.json();
        setShorts(shuffleArray(data));
      }
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadShorts(); }, [loadShorts]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="animate-spin w-8 h-8 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center px-8">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-base font-semibold text-white mb-2">등록된 쇼츠가 없어요</p>
          <p className="text-sm text-zinc-400 mb-6">여러분의 쇼츠로 채워보시겠어요?</p>
          <UploadButton onUploaded={() => { setLoading(true); loadShorts(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-black">
      {/* 업로드 + 버튼 */}
      <UploadFab onUploaded={() => { setLoading(true); loadShorts(); }} />

      {/* 음소거 버튼 */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-30 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {muted ? (
          <VolumeX className="w-4 h-4 text-white" />
        ) : (
          <Volume2 className="w-4 h-4 text-white" />
        )}
      </button>

      {/* 스냅 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {shorts.map((short, index) => (
          <ShortItem
            key={short.id}
            short={short}
            muted={muted}
            containerRef={containerRef}
            onVisible={() => setActiveIndex(index)}
            isActive={activeIndex === index}
          />
        ))}
      </div>

      {/* 하단 프로그레스 바 (BottomNav 위에) */}
      <ProgressBar
        videoId={shorts[activeIndex]?.id}
        containerRef={containerRef}
      />
    </div>
  );
}

function ShortItem({
  short,
  muted,
  containerRef,
  onVisible,
  isActive,
}: {
  short: Short;
  muted: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onVisible: () => void;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // IntersectionObserver — 50% 이상 보이면 활성
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          onVisible();
        }
      },
      {
        root: containerRef.current,
        threshold: [0.5],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, onVisible]);

  // 활성 상태면 재생, 아니면 정지 (첫 프레임은 유지)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
      setPaused(false);
    } else {
      video.pause();
    }
  }, [isActive]);

  // 음소거 동기화
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 1200);
  };

  return (
    <div
      ref={itemRef}
      className="h-full w-full snap-start snap-always relative bg-black"
      onClick={togglePlay}
    >
      {/* 비디오 — object-cover로 꽉 채움, preload로 썸네일 즉시 표시 */}
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        playsInline
        webkit-playsinline="true"
        preload="auto"
        muted={muted}
        onLoadedData={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 로딩 스피너 */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="animate-spin w-8 h-8 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
        </div>
      )}

      {/* 재생/일시정지 아이콘 */}
      <AnimatePresence>
        {(showPauseIcon || paused) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
              {paused ? (
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              ) : (
                <Pause className="w-8 h-8 text-white" fill="white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 하단 프로그레스 바 — 현재 활성 비디오의 진행률 표시 */
function ProgressBar({
  videoId,
  containerRef,
}: {
  videoId?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    if (!videoId || !containerRef.current) return;

    const container = containerRef.current;

    const interval = setInterval(() => {
      // 현재 보이는 비디오 엘리먼트 찾기
      const videos = container.querySelectorAll('video');
      for (const video of videos) {
        if (!video.paused && video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
          break;
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [videoId, containerRef]);

  return (
    <div className="absolute bottom-16 left-0 right-0 z-20 h-[3px] bg-white/10">
      <div
        className="h-full rounded-full"
        style={{ width: `${progress}%`, background: '#BEFF00', transition: 'width 0.2s linear' }}
      />
    </div>
  );
}

/** 업로드 FAB (떠있는 + 버튼) */
function UploadFab({ onUploaded }: { onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/shorts/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setDone(true);
        setTimeout(() => { setDone(false); onUploaded(); }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || '업로드 실패');
      }
    } catch {
      alert('업로드에 실패했어요');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-20 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
        style={{ background: '#BEFF00' }}
      >
        {done ? (
          <Check className="w-6 h-6 text-black" />
        ) : uploading ? (
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-6 h-6 text-black" />
        )}
      </button>
    </>
  );
}

/** 빈 상태용 업로드 버튼 */
function UploadButton({ onUploaded }: { onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/shorts/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setDone(true);
        setTimeout(() => { setDone(false); onUploaded(); }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || '업로드 실패');
      }
    } catch {
      alert('업로드에 실패했어요');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <motion.button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="px-5 py-2.5 rounded-full font-medium text-sm text-black flex items-center gap-1.5 mx-auto"
        style={{ background: '#BEFF00' }}
      >
        {done ? (
          <><Check className="w-5 h-5" /> 업로드 완료!</>
        ) : uploading ? (
          <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> 업로드 중...</>
        ) : (
          <><Upload className="w-4 h-4" /> 동영상 올리기</>
        )}
      </motion.button>
    </>
  );
}

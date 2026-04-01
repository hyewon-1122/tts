'use client';

import { usePlayerStore } from '@/store/playerStore';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// SVG Icons
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const ShuffleIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-gray-400'}`}>
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </svg>
);

const RepeatIcon = ({ mode }: { mode: string }) => (
  <div className="relative">
    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${mode !== 'off' ? 'text-emerald-400' : 'text-gray-400'}`}>
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
    {mode === 'one' && (
      <span className="absolute -top-1 -right-1 text-[8px] font-bold text-emerald-400">1</span>
    )}
  </div>
);

const VolumeIcon = ({ volume }: { volume: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
    {volume === 0 ? (
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    ) : volume < 0.5 ? (
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    ) : (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    )}
  </svg>
);

interface Props {
  onSeek: (time: number) => void;
}

export default function PlayerControls({ onSeek }: Props) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    playMode,
    togglePlay,
    setVolume,
    toggleRepeatMode,
    togglePlayMode,
    playNext,
    playPrev,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 z-50">
      {/* Progress Bar */}
      <div
        className="h-1 bg-gray-700 cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="flex flex-col sm:hidden px-3 py-2 gap-2 pb-[env(safe-area-inset-bottom)]">
        {/* 트랙 정보 + 재생 버튼 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📊</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-gray-400 text-[11px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <button onClick={playPrev} className="text-gray-300 active:text-white p-1">
            <PrevIcon />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 active:scale-95 transition-transform"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={playNext} className="text-gray-300 active:text-white p-1">
            <NextIcon />
          </button>
        </div>
        {/* 하단 컨트롤 */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={togglePlayMode} className="active:scale-110 transition-transform p-1">
            <ShuffleIcon active={playMode === 'shuffle'} />
          </button>
          <button onClick={toggleRepeatMode} className="active:scale-110 transition-transform p-1">
            <RepeatIcon mode={repeatMode} />
          </button>
        </div>
      </div>

      {/* PC/태블릿 레이아웃 */}
      <div className="hidden sm:flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* 트랙 정보 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📊</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {currentTrack.title}
            </p>
            <p className="text-gray-400 text-xs">
              {currentTrack.category} · {currentTrack.date}
            </p>
          </div>
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center gap-4">
          <button onClick={togglePlayMode} className="hover:scale-110 transition-transform">
            <ShuffleIcon active={playMode === 'shuffle'} />
          </button>
          <button onClick={playPrev} className="text-gray-300 hover:text-white transition-colors">
            <PrevIcon />
          </button>
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 hover:scale-105 transition-transform"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={playNext} className="text-gray-300 hover:text-white transition-colors">
            <NextIcon />
          </button>
          <button onClick={toggleRepeatMode} className="hover:scale-110 transition-transform">
            <RepeatIcon mode={repeatMode} />
          </button>
        </div>

        {/* 볼륨 + 시간 */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="text-gray-400 text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex items-center gap-2">
            <VolumeIcon volume={volume} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

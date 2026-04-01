'use client';

import { Track } from '@/lib/types';
import { usePlayerStore } from '@/store/playerStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const categoryColors: Record<string, string> = {
  '시황': 'bg-blue-500/20 text-blue-400',
  '종목': 'bg-amber-500/20 text-amber-400',
  '테마': 'bg-purple-500/20 text-purple-400',
  '이슈': 'bg-red-500/20 text-red-400',
};

interface Props {
  track: Track;
  index: number;
}

export default function TrackCard({ track, index }: Props) {
  const { currentTrack, isPlaying, setTrack, setIsPlaying } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;

  const handleClick = () => {
    if (isActive) {
      setIsPlaying(!isPlaying);
    } else {
      setTrack(track);
      setIsPlaying(true);
    }
  };

  const colorClass = categoryColors[track.category] || 'bg-gray-500/20 text-gray-400';

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left px-4 py-3 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'hover:bg-gray-800/50 border border-transparent'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* 번호 / 이퀄라이저 */}
        <div className="w-8 text-center flex-shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-4">
              <div className="w-0.5 bg-emerald-400 animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '60%' }} />
              <div className="w-0.5 bg-emerald-400 animate-[bounce_0.6s_ease-in-out_infinite_0.15s]" style={{ height: '100%' }} />
              <div className="w-0.5 bg-emerald-400 animate-[bounce_0.6s_ease-in-out_infinite_0.3s]" style={{ height: '40%' }} />
            </div>
          ) : (
            <span className={`text-sm ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
              {index + 1}
            </span>
          )}
        </div>

        {/* 트랙 정보 */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-emerald-400' : 'text-white'}`}>
            {track.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorClass}`}>
              {track.category}
            </span>
            <span className="text-gray-500 text-xs">{track.date}</span>
          </div>
        </div>

        {/* 재생 시간 */}
        <span className="text-gray-500 text-xs flex-shrink-0">
          {formatDuration(track.duration)}
        </span>
      </div>
    </button>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import TrackCard from './TrackCard';

const categories = ['전체', '시황', '종목', '테마', '이슈'];

const SyncIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
  >
    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
  </svg>
);

export default function Playlist() {
  const { playlist, categoryFilter, setCategoryFilter, setPlaylist } =
    usePlayerStore();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const filtered = categoryFilter
    ? playlist.filter((t) => t.category === categoryFilter)
    : playlist;

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      // Drive에서 새 파일 동기화
      const syncRes = await apiFetch('/api/sync', { method: 'POST' });
      const syncData = await syncRes.json();

      if (syncData.error) {
        setSyncMessage(syncData.error);
        setSyncing(false);
        return;
      }

      // 전체 트랙 목록 새로 가져오기
      const tracksRes = await apiFetch('/api/tracks');
      if (tracksRes.ok) {
        const tracks: Track[] = await tracksRes.json();
        if (tracks.length > 0) {
          setPlaylist(tracks);
          setSyncMessage(
            syncData.synced > 0
              ? `${syncData.synced}개 새 트랙 추가됨`
              : '새 트랙 없음 (최신 상태)'
          );
        }
      }
    } catch {
      setSyncMessage('동기화 실패 - Drive 연결을 확인하세요');
    }
    setSyncing(false);
    setTimeout(() => setSyncMessage(null), 3000);
  }, [setPlaylist]);

  return (
    <div className="w-full lg:w-96 flex flex-col lg:border-r border-gray-800 bg-gray-950/50 min-h-0">
      {/* 헤더 */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-bold flex items-center gap-2">
            <span className="text-emerald-400">📈</span>
            시황 브리핑
          </h1>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-colors disabled:opacity-50"
            title="Google Drive에서 새 트랙 동기화"
          >
            <SyncIcon spinning={syncing} />
            동기화
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-1">
          {filtered.length}개의 트랙
          {syncMessage && (
            <span className="ml-2 text-emerald-400">{syncMessage}</span>
          )}
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 px-4 py-3 border-b border-gray-800 overflow-x-auto">
        {categories.map((cat) => {
          const isActive =
            (cat === '전체' && !categoryFilter) || cat === categoryFilter;
          return (
            <button
              key={cat}
              onClick={() =>
                setCategoryFilter(cat === '전체' ? null : cat)
              }
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 트랙 리스트 */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-sm">등록된 트랙이 없습니다</p>
            <p className="text-xs mt-2">
              Google Drive에 mp3 + txt 파일을 올리고
              <br />
              동기화 버튼을 눌러주세요
            </p>
          </div>
        ) : (
          filtered.map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} />
          ))
        )}

        {/* 하단 여백 */}
        <div className="h-24" />
      </div>
    </div>
  );
}

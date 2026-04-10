import { create } from 'zustand';
import { Track, RepeatMode, PlayMode } from '@/lib/types';

interface PlayerStore {
  // 상태
  currentTrack: Track | null;
  playlist: Track[];
  playQueue: Track[]; // 현재 재생 큐 (전체듣기 시 오늘 트랙만 등)
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  playMode: PlayMode;
  currentLineIndex: number;
  categoryFilter: string | null;
  shuffleOrder: number[];
  bookmarkedIds: Set<string>;

  // seek 함수 (useAudioPlayer에서 등록)
  seekTo: (time: number) => void;
  setSeekTo: (fn: (time: number) => void) => void;

  // 액션
  setTrack: (track: Track) => void;
  setPlaylist: (tracks: Track[]) => void;
  setPlayQueue: (tracks: Track[]) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeatMode: () => void;
  togglePlayMode: () => void;
  setCurrentLineIndex: (index: number) => void;
  setCategoryFilter: (category: string | null) => void;
  playNext: () => void;
  playPrev: () => void;
  getFilteredPlaylist: () => Track[];
  closePlayer: () => void;
  // 재생목록 관리
  resetQueueAndPlay: (tracks: Track[]) => void;  // 리셋 후 새 큐로 재생
  appendToQueue: (track: Track) => void;          // 큐 하단에 추가 + 재생
  removeFromQueue: (index: number) => void;       // 큐에서 삭제
  reorderQueue: (from: number, to: number) => void; // 큐 순서 변경
  addToQueue: (track: Track) => void;
  showAddedToast: boolean;
  setShowAddedToast: (v: boolean) => void;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  getBookmarkedTracks: () => Track[];
}

function generateShuffleOrder(length: number, currentIndex?: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // 현재 재생 중인 트랙을 맨 앞으로
  if (currentIndex !== undefined) {
    const pos = indices.indexOf(currentIndex);
    if (pos > 0) {
      [indices[0], indices[pos]] = [indices[pos], indices[0]];
    }
  }
  return indices;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  playlist: [],
  playQueue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  repeatMode: 'off',
  playMode: 'sequential',
  seekTo: () => {},
  setSeekTo: (fn) => set({ seekTo: fn }),
  bookmarkedIds: new Set<string>(),
  currentLineIndex: -1,
  categoryFilter: null,
  shuffleOrder: [],

  setTrack: (track) => set({ currentTrack: track, currentTime: 0, currentLineIndex: -1 }),

  setPlaylist: (tracks) => {
    set({ playlist: tracks, shuffleOrder: generateShuffleOrder(tracks.length) });
  },

  setPlayQueue: (tracks) => {
    set({ playQueue: tracks, shuffleOrder: generateShuffleOrder(tracks.length) });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setCurrentTime: (time) => {
    const { currentTrack } = get();
    if (!currentTrack) return set({ currentTime: time });

    const lines = currentTrack.content.lines;
    let lineIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (time >= lines[i].time) {
        lineIndex = i;
        break;
      }
    }
    set({ currentTime: time, currentLineIndex: lineIndex });
  },

  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  toggleRepeatMode: () =>
    set((s) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const next = modes[(modes.indexOf(s.repeatMode) + 1) % modes.length];
      return { repeatMode: next };
    }),

  togglePlayMode: () =>
    set((s) => {
      const next: PlayMode = s.playMode === 'sequential' ? 'shuffle' : 'sequential';
      const filtered = get().getFilteredPlaylist();
      const currentIndex = filtered.findIndex((t) => t.id === s.currentTrack?.id);
      return {
        playMode: next,
        shuffleOrder:
          next === 'shuffle'
            ? generateShuffleOrder(filtered.length, currentIndex)
            : [],
      };
    }),

  setCurrentLineIndex: (index) => set({ currentLineIndex: index }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),

  getFilteredPlaylist: () => {
    const { playQueue, playlist, categoryFilter } = get();
    // playQueue가 있으면 그걸 사용 (전체듣기 등)
    if (playQueue.length > 0) return playQueue;
    if (!categoryFilter) return playlist;
    return playlist.filter((t) => t.category === categoryFilter);
  },

  playNext: () => {
    const { currentTrack, repeatMode, playMode, shuffleOrder } = get();
    const filtered = get().getFilteredPlaylist();
    if (!currentTrack || filtered.length === 0) return;

    if (repeatMode === 'one') {
      set({ currentTime: 0, currentLineIndex: -1 });
      return;
    }

    const currentIndex = filtered.findIndex((t) => t.id === currentTrack.id);

    let nextIndex: number;
    if (playMode === 'shuffle') {
      const shufflePos = shuffleOrder.indexOf(currentIndex);
      const nextShufflePos = shufflePos + 1;
      if (nextShufflePos >= shuffleOrder.length) {
        if (repeatMode === 'all') {
          const newOrder = generateShuffleOrder(filtered.length);
          set({ shuffleOrder: newOrder });
          nextIndex = newOrder[0];
        } else {
          set({ isPlaying: false });
          return;
        }
      } else {
        nextIndex = shuffleOrder[nextShufflePos];
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= filtered.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    set({
      currentTrack: filtered[nextIndex],
      currentTime: 0,
      currentLineIndex: -1,
      isPlaying: true,
    });
  },

  playPrev: () => {
    const { currentTrack, currentTime, playMode, shuffleOrder } = get();
    const filtered = get().getFilteredPlaylist();
    if (!currentTrack || filtered.length === 0) return;

    // 3초 이상 재생했으면 처음으로
    if (currentTime > 3) {
      set({ currentTime: 0, currentLineIndex: -1 });
      return;
    }

    const currentIndex = filtered.findIndex((t) => t.id === currentTrack.id);

    let prevIndex: number;
    if (playMode === 'shuffle') {
      const shufflePos = shuffleOrder.indexOf(currentIndex);
      prevIndex = shufflePos > 0 ? shuffleOrder[shufflePos - 1] : shuffleOrder[shuffleOrder.length - 1];
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = filtered.length - 1;
    }

    set({
      currentTrack: filtered[prevIndex],
      currentTime: 0,
      currentLineIndex: -1,
      isPlaying: true,
    });
  },

  closePlayer: () => set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0, playQueue: [] }),

  // 재생목록 리셋 후 새 큐로 재생 (그룹 재생, 전체 듣기)
  resetQueueAndPlay: (tracks) => {
    if (tracks.length === 0) return;
    set({
      playQueue: tracks,
      currentTrack: tracks[0],
      currentTime: 0,
      currentLineIndex: -1,
      isPlaying: true,
      shuffleOrder: generateShuffleOrder(tracks.length),
    });
  },

  // 큐 하단에 추가 + 바로 재생 (단건 클릭)
  appendToQueue: (track) => {
    const { playQueue, currentTrack } = get();
    const exists = playQueue.find(t => t.id === track.id);
    const newQueue = exists ? playQueue : [...playQueue, track];
    set({
      playQueue: newQueue,
      currentTrack: track,
      currentTime: 0,
      currentLineIndex: -1,
      isPlaying: true,
      showAddedToast: !exists,
    });
    if (!exists) setTimeout(() => set({ showAddedToast: false }), 2000);
  },

  // 큐에서 삭제
  removeFromQueue: (index) => {
    const { playQueue, currentTrack } = get();
    const newQueue = [...playQueue];
    const removed = newQueue.splice(index, 1)[0];
    set({ playQueue: newQueue });
    // 현재 재생 중인 트랙이 삭제되면 다음 곡으로
    if (currentTrack?.id === removed?.id) {
      if (newQueue.length > 0) {
        const nextIdx = Math.min(index, newQueue.length - 1);
        set({ currentTrack: newQueue[nextIdx], currentTime: 0 });
      } else {
        set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 });
      }
    }
  },

  // 큐 순서 변경
  reorderQueue: (from, to) => {
    const { playQueue } = get();
    const newQueue = [...playQueue];
    const [item] = newQueue.splice(from, 1);
    newQueue.splice(to, 0, item);
    set({ playQueue: newQueue });
  },

  showAddedToast: false,
  setShowAddedToast: (v) => set({ showAddedToast: v }),

  addToQueue: (track) => {
    const { playQueue } = get();
    if (!playQueue.find(t => t.id === track.id)) {
      set({ playQueue: [...playQueue, track], showAddedToast: true });
      setTimeout(() => set({ showAddedToast: false }), 2000);
    }
  },

  toggleBookmark: (id) => {
    const { bookmarkedIds } = get();
    const next = new Set(bookmarkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ bookmarkedIds: next });
  },

  isBookmarked: (id) => get().bookmarkedIds.has(id),

  getBookmarkedTracks: () => {
    const { playlist, bookmarkedIds } = get();
    return playlist.filter((t) => bookmarkedIds.has(t.id));
  },
}));

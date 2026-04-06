'use client';

import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { getCategoryLabel } from '@/lib/categories';

/**
 * 전역 싱글톤 Audio 객체
 * 컴포넌트 리마운트와 무관하게 단 1개만 존재
 */
let globalAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

/** 현재 로드된 트랙 ID (중복 로드 방지) */
let loadedTrackId: string | null = null;

/**
 * 오디오 플레이어 훅 - Player.tsx에서만 호출
 */
export function useAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setSeekTo,
    playNext,
    playPrev,
    togglePlay,
  } = usePlayerStore();

  const seekTo = useCallback((time: number) => {
    const audio = getAudio();
    audio.currentTime = time;
    setCurrentTime(time);
  }, [setCurrentTime]);

  // seekTo를 store에 등록
  useEffect(() => {
    setSeekTo(seekTo);
  }, [seekTo, setSeekTo]);

  // 이벤트 리스너 (한 번만 등록, cleanup으로 중복 방지)
  useEffect(() => {
    const audio = getAudio();

    const handleTimeUpdate = () => {
      usePlayerStore.getState().setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      usePlayerStore.getState().setDuration(audio.duration);
    };
    const handleEnded = () => {
      usePlayerStore.getState().playNext();
    };
    const handleError = () => {
      usePlayerStore.getState().setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []); // 의존성 없음 — store에서 직접 getState()로 접근

  // 트랙 변경 시 소스 업데이트
  useEffect(() => {
    const audio = getAudio();
    if (!currentTrack) {
      audio.pause();
      audio.src = '';
      loadedTrackId = null;
      return;
    }

    // 같은 트랙이면 다시 로드하지 않음
    if (loadedTrackId === currentTrack.id) return;

    // 기존 재생 즉시 중단
    audio.pause();
    audio.src = currentTrack.audioUrl;
    audio.load();
    loadedTrackId = currentTrack.id;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }

    // Media Session
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.category,
        album: '머니터링 Pick',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // 재생/일시정지 상태 변경 + 네이티브 알림 업데이트
  useEffect(() => {
    const audio = getAudio();
    if (!currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else {
      audio.pause();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }

    // Android 네이티브 브릿지 — 상태바 알림 업데이트
    const bridge = (window as unknown as { NativeBridge?: { updatePlayback: (p: boolean, t: string, a: string) => void } }).NativeBridge;
    if (bridge) {
      bridge.updatePlayback(isPlaying, currentTrack.title, getCategoryLabel(currentTrack.category));
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Media Session 핸들러 + 네이티브 콜백 등록
  useEffect(() => {
    // Web Media Session
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!usePlayerStore.getState().isPlaying) usePlayerStore.getState().togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (usePlayerStore.getState().isPlaying) usePlayerStore.getState().togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().playNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });
    }

    // Android 네이티브 → 웹 콜백 (상태바 버튼에서 호출됨)
    const w = window as unknown as Record<string, unknown>;
    w.__nativePlay = () => {
      if (!usePlayerStore.getState().isPlaying) usePlayerStore.getState().togglePlay();
    };
    w.__nativePause = () => {
      if (usePlayerStore.getState().isPlaying) usePlayerStore.getState().togglePlay();
    };
    w.__nativeNext = () => usePlayerStore.getState().playNext();
    w.__nativePrev = () => usePlayerStore.getState().playPrev();
  }, [seekTo]);

  // 볼륨
  useEffect(() => {
    getAudio().volume = volume;
  }, [volume]);

  return { seekTo };
}

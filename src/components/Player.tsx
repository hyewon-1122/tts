'use client';

import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import PlayerControls from './PlayerControls';

export default function Player() {
  const { seekTo } = useAudioPlayer();
  return <PlayerControls onSeek={seekTo} />;
}

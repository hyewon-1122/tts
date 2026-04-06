export interface TrackLine {
  time: number;
  text: string;
}

export interface TrackContent {
  title: string;
  category: string;
  date: string;
  duration: number;
  text: string;
  srt?: string;
  lines: TrackLine[];
}

export interface Track {
  id: string;
  title: string;
  category: string;
  date: string;
  duration: number;
  s3Key?: string;
  audioUrl: string;
  textFileId?: string;
  content: TrackContent;
  createdAt: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type PlayMode = 'sequential' | 'shuffle';

export interface PlayerState {
  currentTrack: Track | null;
  playlist: Track[];
  filteredPlaylist: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  playMode: PlayMode;
  currentLineIndex: number;
  categoryFilter: string | null;
}

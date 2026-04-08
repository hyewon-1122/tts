'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Volume2, ChevronDown, X, FileText, List } from 'lucide-react';
import MarqueeText from './MarqueeText';
import TouchSlider from './TouchSlider';
import { usePlayerStore } from '@/store/playerStore';
import { getCategoryLabel, getCategoryColor, getCategoryIcon } from '@/lib/categories';
import Image from 'next/image';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  onSeek: (time: number) => void;
}

export default function PlayerControls({ onSeek }: Props) {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    playMode, repeatMode, closePlayer,
    togglePlay, setVolume, toggleRepeatMode, togglePlayMode, playNext, playPrev,
  } = usePlayerStore();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'playlist'>('transcript');
  const [loadedText, setLoadedText] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  // 재생 화면 열리면 텍스트 로드
  useEffect(() => {
    const textSource = currentTrack?.textUrl || currentTrack?.textFileId;
    if (expanded && currentTrack && textSource && !currentTrack.content.text && !loadedText) {
      setTextLoading(true);
      const apiUrl = textSource.startsWith('http')
        ? `/api/text?url=${encodeURIComponent(textSource)}`
        : `/api/text?id=${textSource}`;
      fetch(apiUrl)
        .then(r => r.ok ? r.text() : '')
        .then(t => { setLoadedText(t); setTextLoading(false); })
        .catch(() => setTextLoading(false));
    }
    if (!expanded) setLoadedText('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, currentTrack?.id]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const catColor = getCategoryColor(currentTrack.category);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  };

  // --- Compact Player ---
  const compactPlayer = (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed left-0 right-0 z-30 border-t border-zinc-800 bg-gradient-to-b from-zinc-900 to-black"
      style={{ bottom: 'calc(56px + max(env(safe-area-inset-bottom, 0px), 8px))' }}
      onClick={() => setExpanded(true)}
    >
      <div className="h-1 bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#BEFF00' }} />
      </div>
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden relative">
          <Image src={getCategoryIcon(currentTrack.category)} alt="" fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <MarqueeText text={currentTrack.title} className="text-sm font-semibold text-white" paused={!isPlaying} />
          <p className="text-xs text-zinc-400">{getCategoryLabel(currentTrack.category)}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
        >
          {isPlaying
            ? <Pause className="w-5 h-5 text-black" fill="black" />
            : <Play className="w-5 h-5 text-black ml-0.5" fill="black" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); closePlayer(); }}
          className="flex-shrink-0 p-1 text-zinc-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  // --- Expanded Player ---
  const expandedPlayer = (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-zinc-950 to-black flex flex-col pt-[env(safe-area-inset-top)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <button onClick={() => setExpanded(false)} className="p-2 text-zinc-400"><ChevronDown className="w-6 h-6" /></button>
        <span className="text-sm text-zinc-400">재생 중</span>
        <button onClick={() => setExpanded(false)} className="p-2 text-zinc-400"><X className="w-5 h-5" /></button>
      </div>

      {/* Info */}
      <div className="px-8 pt-6 pb-4">
        <h2 className="text-xl font-bold text-white text-center">{currentTrack.title}</h2>
        <p className="text-sm text-zinc-400 text-center mt-1">
          {getCategoryLabel(currentTrack.category)} · {currentTrack.date}
        </p>
      </div>

      {/* Progress */}
      <div className="px-8 mb-2">
        <TouchSlider
          value={duration > 0 ? currentTime / duration : 0}
          onChange={(v) => onSeek(v * duration)}
          trackColor="#27272a"
          fillColor="#BEFF00"
          thumbColor="#BEFF00"
          thumbSize={14}
          height={5}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-zinc-400 font-mono">{formatTime(currentTime)}</span>
          <span className="text-xs text-zinc-400 font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-8 py-4">
        <button onClick={togglePlayMode} className="p-2">
          <Shuffle className="w-5 h-5" style={{ color: playMode === 'shuffle' ? '#BEFF00' : '#a1a1aa' }} />
        </button>
        <button onClick={playPrev} className="p-2">
          <SkipBack className="w-7 h-7 text-zinc-400" fill="currentColor" />
        </button>
        <motion.button onClick={togglePlay} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
          {isPlaying
            ? <Pause className="w-6 h-6 text-black" fill="black" />
            : <Play className="w-6 h-6 text-black ml-0.5" fill="black" />}
        </motion.button>
        <button onClick={playNext} className="p-2">
          <SkipForward className="w-7 h-7 text-zinc-400" fill="currentColor" />
        </button>
        <button onClick={toggleRepeatMode} className="p-2 relative">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: repeatMode !== 'off' ? '#BEFF00' : '#a1a1aa' }}>
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
          {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold" style={{ color: '#BEFF00' }}>1</span>}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-8 mb-4">
        <Volume2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <div className="flex-1">
          <TouchSlider
            value={volume}
            onChange={setVolume}
            trackColor="#3f3f46"
            fillColor="#ffffff"
            thumbColor="#ffffff"
            thumbSize={12}
            height={4}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-8">
        {([{ id: 'transcript' as const, label: '내용', icon: FileText }, { id: 'playlist' as const, label: '목록', icon: List }]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium relative ${isActive ? 'text-white' : 'text-zinc-400'}`}>
              <Icon className="w-4 h-4" />{tab.label}
              {isActive && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#BEFF00' }} />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-8 py-4" id="transcript-scroll">
        {activeTab === 'transcript' ? (
          textLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
            </div>
          ) : (
            <SyncedTranscript text={loadedText || currentTrack.content.text} srt={currentTrack.content.srt} currentTime={currentTime} duration={duration} />
          )
        ) : (
          <ExpandedPlaylistView />
        )}
        <div className="h-8" />
      </div>
    </motion.div>
  );

  return (
    <>
      {!expanded && compactPlayer}
      <AnimatePresence>{expanded && expandedPlayer}</AnimatePresence>
    </>
  );
}

function ExpandedPlaylistView() {
  const { currentTrack, setTrack, setIsPlaying, isPlaying, getFilteredPlaylist } = usePlayerStore();
  const filtered = getFilteredPlaylist();

  return (
    <div className="space-y-2">
      {filtered.map((track) => {
        const isCurrent = track.id === currentTrack?.id;
        const catColor = getCategoryColor(track.category);
        return (
          <button key={track.id} onClick={() => { setTrack(track); setIsPlaying(true); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${isCurrent ? 'border' : 'border border-transparent hover:bg-zinc-800/50'}`}
            style={isCurrent ? { background: 'rgba(190,255,0,0.1)', borderColor: 'rgba(190,255,0,0.3)' } : {}}>
            <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden relative">
              <Image src={getCategoryIcon(track.category)} alt="" fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: isCurrent ? '#BEFF00' : 'white' }}>{track.title}</p>
              <p className="text-xs text-zinc-500">{getCategoryLabel(track.category)}</p>
            </div>
            {isCurrent && isPlaying && (
              <div className="flex items-end gap-0.5 h-4">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-1 rounded-full" style={{ background: '#BEFF00' }}
                    animate={{ height: [4, 12, 4] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** 가사 싱크 — 문단별 하이라이트 + 자동 스크롤 */
/** 화자별 색상 */
const SPEAKER_COLORS: Record<string, string> = {
  '톰': '#BEFF00',
  '제리': '#3B82F6',
};
let colorIndex = 0;
const AUTO_COLORS = ['#BEFF00', '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];
const speakerColorCache: Record<string, string> = {};

function getSpeakerColor(name: string): string {
  if (SPEAKER_COLORS[name]) return SPEAKER_COLORS[name];
  if (!speakerColorCache[name]) {
    speakerColorCache[name] = AUTO_COLORS[colorIndex % AUTO_COLORS.length];
    colorIndex++;
  }
  return speakerColorCache[name];
}

/** SRT 파싱 — "00:01:23,456" → 초 */
function parseSrtTime(s: string): number {
  const m = s.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]) + parseInt(m[4]) / 1000;
}

function parseSrt(srt: string): Array<{ startTime: number; endTime: number; speaker: string; text: string }> {
  const blocks = srt.trim().split(/\n\n+/);
  return blocks.map((block) => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    // 두 번째 줄: 타임코드
    const timeMatch = lines[1].match(/(.+?)\s*-->\s*(.+)/);
    if (!timeMatch) return null;
    const startTime = parseSrtTime(timeMatch[1]);
    const endTime = parseSrtTime(timeMatch[2]);
    // 나머지 줄: 텍스트
    const fullText = lines.slice(2).join(' ').trim();
    // 화자 라벨 추출: "[톰] 내용" 또는 "톰: 내용"
    const speakerMatch = fullText.match(/^\[(.+?)\]\s*(.*)/) || fullText.match(/^(.+?):\s+(.*)/);
    const speaker = speakerMatch ? speakerMatch[1] : '';
    const text = speakerMatch ? speakerMatch[2] : fullText;
    return { startTime, endTime, speaker, text };
  }).filter(Boolean) as Array<{ startTime: number; endTime: number; speaker: string; text: string }>;
}

/** md 텍스트를 블록으로 파싱 (기존 추정 방식) */
function parseMdBlocks(text: string, dur: number): Array<{ startTime: number; endTime: number; speaker: string; text: string }> {
  const blocks: Array<{ speaker: string; text: string }> = [];
  let currentSpeaker = '';
  let currentText = '';

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const speakerMatch = trimmed.match(/^\[(.+?)\]\s*$/);
    if (speakerMatch) {
      if (currentText.trim()) blocks.push({ speaker: currentSpeaker, text: currentText.trim() });
      currentSpeaker = speakerMatch[1];
      currentText = '';
      continue;
    }
    if (trimmed === '') {
      if (currentText.trim()) { blocks.push({ speaker: currentSpeaker, text: currentText.trim() }); currentText = ''; }
      continue;
    }
    currentText += (currentText ? ' ' : '') + trimmed;
  }
  if (currentText.trim()) blocks.push({ speaker: currentSpeaker, text: currentText.trim() });
  if (blocks.length === 0) return [];

  const totalChars = blocks.reduce((s, b) => s + b.text.length, 0);
  const estDur = dur > 0 ? dur : totalChars / 5;
  let speakerChanges = 0, samePauses = 0;
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].speaker !== blocks[i-1].speaker) speakerChanges++; else samePauses++;
  }
  const totalPause = speakerChanges * 2.5 + samePauses * 1.0;
  const speakTime = Math.max(estDur - totalPause, estDur * 0.5);

  let time = 0;
  return blocks.map((b, i) => {
    const startTime = time;
    const blockDur = totalChars > 0 ? (b.text.length / totalChars) * speakTime : speakTime / blocks.length;
    const pause = i < blocks.length - 1 ? (blocks[i+1].speaker !== b.speaker ? 2.5 : 1.0) : 0;
    time += blockDur + pause;
    return { ...b, startTime, endTime: time };
  });
}

/**
 * 가사 싱크
 * - SRT가 있으면 정확한 타임스탬프 사용
 * - 없으면 글자수 기반 추정
 */
function SyncedTranscript({ text, srt, currentTime, duration }: { text: string; srt?: string; currentTime: number; duration: number }) {
  const segments = useMemo(() => {
    // SRT가 있으면 정확한 싱크
    if (srt && srt.trim().length > 10) {
      const parsed = parseSrt(srt);
      if (parsed.length > 0) return parsed;
    }
    // 없으면 추정
    return parseMdBlocks(text, duration);
  }, [text, srt, duration]);

  const activeIndex = useMemo(() => {
    if (segments.length === 0 || currentTime <= 0) return 0;
    for (let i = segments.length - 1; i >= 0; i--) {
      if (currentTime >= segments[i].startTime) return i;
    }
    return 0;
  }, [segments, currentTime]);

  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex]);

  if (segments.length === 0) {
    return <p className="text-sm text-zinc-500">내용이 없어요</p>;
  }

  return (
    <div className="space-y-2">
      {segments.map((seg, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={`text-sm leading-relaxed py-2.5 px-3 rounded-lg transition-all duration-300 ${
              isActive
                ? 'text-white bg-[#BEFF00]/10 border border-[#BEFF00]/30'
                : isPast
                  ? 'text-zinc-600'
                  : 'text-zinc-400'
            }`}
          >
            {seg.speaker && (
              <span
                className="text-sm font-bold mr-2 inline-block mb-0.5"
                style={{ color: getSpeakerColor(seg.speaker) }}
              >
                {seg.speaker}
              </span>
            )}
            {seg.text}
          </div>
        );
      })}
    </div>
  );
}

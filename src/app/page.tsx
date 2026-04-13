'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Users, Bookmark, BookmarkCheck, RefreshCw, X, Search, ListMusic } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { categories, getCategoryLabel, getCategoryColor, getCategoryIcon } from '@/lib/categories';
import Image from 'next/image';
import Player from '@/components/Player';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import BriefingPage from '@/components/BriefingPage';
import BriefingDetailPage from '@/components/BriefingDetailPage';
import LabsPage from '@/components/LabsPage';

// ===== PULL TO REFRESH =====
function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    pulling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;

    // 스크롤이 맨 위일 때만 pull 시작
    if (scrollTop <= 0) {
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 10) {
        pulling.current = true;
        setPullY(Math.min((diff - 10) * 0.4, 80));
        e.preventDefault(); // 스크롤 방지
      }
    }

    // pull 중이면 계속 업데이트
    if (pulling.current) {
      const diff = e.touches[0].clientY - startY.current;
      setPullY(Math.min(Math.max(0, (diff - 10) * 0.4), 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 40 && !refreshing) {
      setRefreshing(true);
      setPullY(50);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = 0;
    pulling.current = false;
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto relative"
      style={{ overscrollBehavior: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullY || (refreshing ? 48 : 0) }}
      >
        <RefreshCw
          className={`w-5 h-5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`}
          style={!refreshing ? { transform: `rotate(${pullY * 4}deg)` } : {}}
        />
      </div>
      {children}
    </div>
  );
}

// ===== HOME PAGE =====
function HomePage({ onRefresh, onOpenBriefing }: { onRefresh: () => Promise<void>; onOpenBriefing?: (gi: number) => void }) {
  const { playlist, resetQueueAndPlay, appendToQueue } = usePlayerStore();
  const todayMarketTrack = playlist.find((t) => t.category === 'today_market');

  const [showNoPickToast, setShowNoPickToast] = useState(false);

  // 1. 전체 듣기 → 리셋 후 오늘 트랙으로 새 큐
  const handlePlayAll = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTracks = playlist.filter((t) => t.date === today);
    if (todayTracks.length === 0) {
      setShowNoPickToast(true);
      return;
    }
    resetQueueAndPlay(todayTracks);
  };

  // 2. 최신 시황 듣기 → 큐 하단 추가 또는 새 큐
  const handlePlayMarket = () => {
    if (!todayMarketTrack) return;
    appendToQueue(todayMarketTrack);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 오늘의 Pick 없음 팝업 */}
      <AnimatePresence>
        {showNoPickToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNoPickToast(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-zinc-900 rounded-2xl p-6 mx-8 max-w-sm w-full border border-zinc-800 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowNoPickToast(false)}
                className="absolute top-3 right-3 text-zinc-500 p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-4xl mb-3">🎙️</div>
              <p className="text-white font-semibold text-base mb-1">오늘의 머니터링 Pick이 없어요</p>
              <p className="text-zinc-400 text-sm">빨리 준비할게요!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 고정: 로고만 */}
      <div className="flex-shrink-0 bg-black z-10 px-4 pt-8 pb-3">
        <Logo />
      </div>

      <PullToRefresh onRefresh={onRefresh}>
        <div className="px-4">
          {/* 섹션 1: 오늘의 Pick */}
          <h2 className="text-xl font-bold mb-1">오늘의 Pick</h2>
          <p className="text-zinc-400 text-sm mb-4">AI가 읽어주는 오늘의 시황과 종목을 들어보세요.</p>
          <div className="mb-8">
            <motion.button onClick={handlePlayAll}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 px-5 rounded-xl font-bold text-black flex items-center justify-center gap-2 relative overflow-hidden group"
              style={{ background: '#BEFF00' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25) 0%, transparent 70%)' }} />
              <Play className="w-5 h-5 relative" fill="black" />
              <span className="text-base relative">전체 듣기</span>
            </motion.button>
          </div>

          {/* 섹션 2: 최신 시황 */}
          <h2 className="text-xl font-bold mb-1">최신 시황</h2>
          <p className="text-sm text-zinc-400 mb-3">최신 국내외 증시 동향과 주요 이슈를 들어보세요.</p>
          {todayMarketTrack ? (
            <motion.div whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-5 mb-6 border border-zinc-700 hover:border-zinc-600 transition-all relative overflow-hidden cursor-pointer"
              onClick={handlePlayMarket}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(190, 255, 0, 0.2), transparent)' }} />
              <div className="relative">
                <h3 className="font-bold text-base mb-2">{todayMarketTrack.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Users className="w-3 h-3" /><span>AI 해설</span><span>·</span><span>{todayMarketTrack.date}</span>
                  </div>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BEFF00' }}>
                    <Play className="w-5 h-5 ml-0.5 text-black" fill="black" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-zinc-800 text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm font-semibold text-white mb-1">최신 시황이 없어요</p>
              <p className="text-xs text-zinc-500">곧 새로운 시황 브리핑이 올라와요!</p>
            </div>
          )}

          {/* 브리핑 그룹 카드 */}
          <HomeBriefingGroups onOpenGroup={onOpenBriefing} />
        </div>
      </PullToRefresh>
    </div>
  );
}

// ===== SEARCH PAGE =====
function SearchPage() {
  const { playlist, categoryFilter, setCategoryFilter } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredByCategory = categoryFilter
    ? playlist.filter((t) => t.category === categoryFilter)
    : playlist;

  const results = query.trim()
    ? playlist.filter((t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.content.text.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="px-4 pt-8 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5" style={{ color: '#BEFF00' }} />
        <h1 className="text-xl font-bold text-white">검색</h1>
      </div>
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          placeholder="검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-zinc-900 pl-12 pr-12 py-4 rounded-xl text-white placeholder-zinc-500 outline-none transition-colors"
          style={{ borderWidth: 1, borderColor: focused ? '#BEFF00' : '#27272a' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center">
            <span className="text-xs text-zinc-300">✕</span>
          </button>
        )}
      </div>

      {!query.trim() ? (
        <>
          {/* 인기 검색어 */}
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">인기 검색어</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {['반도체', 'AI', '테슬라', '삼성전자', '엔비디아', '시황', 'HBM', '전기차'].map((kw) => (
              <button key={kw} onClick={() => setQuery(kw)}
                className="px-3.5 py-2 rounded-full text-sm bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors">
                {kw}
              </button>
            ))}
          </div>

          {/* 최근 에피소드 */}
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">최근 등록</h2>
          <div className="space-y-2.5">
            {playlist.slice(0, 5).map((track, i) => (
              <EpisodeCard key={track.id} track={track} index={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-400 mb-4">{results.length}개의 머니터링 Pick</p>
          <div className="space-y-3">
            {results.map((track, i) => (
              <EpisodeCard key={track.id} track={track} index={i} />
            ))}
            {results.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-base font-semibold text-white mb-2">검색결과가 없어요</p>
                <p className="text-sm text-zinc-400">다른 키워드로 검색해보세요</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===== SAVED / PLAYLIST PAGE =====
function SavedPage({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { getBookmarkedTracks, setTrack, setIsPlaying } = usePlayerStore();
  const bookmarked = getBookmarkedTracks();

  const handlePlayAll = () => {
    if (bookmarked.length > 0) {
      setTrack(bookmarked[0]);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-black z-10 px-4 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <ListMusic className="w-5 h-5" style={{ color: '#BEFF00' }} />
          <h1 className="text-xl font-bold text-white">플레이리스트</h1>
        </div>
        {bookmarked.length > 0 && (
          <motion.button onClick={handlePlayAll} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-5 rounded-xl font-bold text-black flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}>
            <Play className="w-5 h-5" fill="black" />
            <span>전체 재생</span>
          </motion.button>
        )}
      </div>

      <PullToRefresh onRefresh={onRefresh}>
        <div className="px-4 pb-8">
          {bookmarked.length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100dvh - 200px)' }}>
              <div className="text-center px-8">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-base font-semibold text-white mb-2">저장된 머니터링 Pick이 없어요</p>
                <p className="text-sm text-zinc-400">북마크 버튼을 눌러<br />플레이리스트에 추가하세요</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarked.map((track, i) => (
                <EpisodeCard key={track.id} track={track} index={i} showBookmark />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}

// ===== EPISODE CARD =====
function EpisodeCard({ track, index, large, showBookmark }: { track: Track; index: number; large?: boolean; showBookmark?: boolean }) {
  const { currentTrack, setTrack, setIsPlaying, toggleBookmark, isBookmarked } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;
  const catColor = getCategoryColor(track.category);
  const iconSize = large ? 'w-16 h-16 text-2xl' : 'w-14 h-14 text-xl';
  const bookmarked = isBookmarked(track.id);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(track.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => { setTrack(track); setIsPlaying(true); }}
      className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 group hover:border-zinc-700 cursor-pointer flex items-center gap-3 transition-all"
    >
      <div className={`${iconSize} rounded-lg flex-shrink-0 overflow-hidden relative`}>
        <Image src={getCategoryIcon(track.category)} alt="" fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold line-clamp-2 transition-colors ${isCurrent ? '' : 'text-white group-hover:text-[#BEFF00]'}`}
          style={isCurrent ? { color: '#BEFF00' } : {}}>
          {track.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${catColor}20`, color: catColor }}>
            {getCategoryLabel(track.category)}
          </span>
          <span className="text-xs text-zinc-500">{track.date}</span>
        </div>
      </div>
      {/* 북마크 버튼 — 터치 영역 넓게 */}
      <button onClick={handleBookmark} className="flex-shrink-0 p-3 -m-1">
        {bookmarked ? (
          <BookmarkCheck className="w-6 h-6" style={{ color: '#BEFF00' }} />
        ) : (
          <Bookmark className="w-6 h-6 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        )}
      </button>
    </motion.div>
  );
}

// ===== HOME BRIEFING GROUPS =====
const GROUP_EMOJIS_HOME = ['🔥', '💰', '🚀', '⚡', '🌍', '💡', '🏭', '📊', '🛡️', '🎯'];

interface BriefingGroupData {
  title: string;
  stocks: Array<{ name: string; theme: string; summary: string }>;
}

function HomeBriefingGroups({ onOpenGroup }: { onOpenGroup?: (gi: number) => void }) {
  const [groups, setGroups] = useState<BriefingGroupData[]>([]);
  const { playlist, resetQueueAndPlay } = usePlayerStore();

  useEffect(() => {
    fetch('/briefing-data.json')
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => {});
  }, []);

  const playGroup = (group: BriefingGroupData) => {
    const names = group.stocks.map((s) => s.name);
    const matched = playlist.filter((t) => names.some((n) => t.title.includes(n)));
    if (matched.length > 0) resetQueueAndPlay(matched);
  };

  if (groups.length === 0) return null;

  // 그룹 목록 뷰 — 클릭 시 새 페이지로 진입
  return (
    <div className="mt-2 pb-8">
      <h2 className="text-xl font-bold mb-1">이슈 브리핑</h2>
      <p className="text-sm text-zinc-400 mb-4">지금 가장 뜨거운 종목들을 확인하세요</p>
      <div className="space-y-2.5">
        {groups.map((group, gi) => {
          const title = group.title.replace(/^\d+\s*/, '');
          const emoji = GROUP_EMOJIS_HOME[gi % GROUP_EMOJIS_HOME.length];
          return (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              onClick={() => onOpenGroup?.(gi)}
              className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl border border-zinc-800/50 p-3.5 cursor-pointer hover:border-zinc-700/50 transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <motion.span className="text-xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }}>
                  {emoji}
                </motion.span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1 w-10 rounded-full" style={{ background: 'linear-gradient(90deg, #BEFF00, transparent)' }} />
                    <span className="text-[11px] text-zinc-500">{group.stocks.length}개 종목</span>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); playGroup(group); }}
                  className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}>
                  <Play className="w-3.5 h-3.5 ml-0.5 text-black" fill="black" />
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-1">
                {group.stocks.slice(0, 4).map((s, si) => (
                  <span key={si} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400">{s.name}</span>
                ))}
                {group.stocks.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/40 text-zinc-500">+{group.stocks.length - 4}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ===== MAIN =====
export default function Home() {
  const { setPlaylist, currentTrack, playlist } = usePlayerStore();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [briefingGroup, setBriefingGroup] = useState<number | null>(null);

  const loadTracks = useCallback(async () => {
    try {
      // 캐시 무효화 — 항상 최신 데이터
      const res = await apiFetch(`/api/tracks?t=${Date.now()}`);
      if (res.ok) {
        const tracks: Track[] = await res.json();
        if (tracks.length > 0) {
          setPlaylist(tracks);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    }
    setLoading(false);
  }, [setPlaylist]);

  useEffect(() => {
    loadTracks();
    const interval = setInterval(loadTracks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTracks]);

  // 로딩 중
  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#BEFF00] border-t-transparent rounded-full mx-auto" />
          <p className="text-zinc-400 text-sm mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 데이터 로드 실패 + 기존 데이터도 없음 → 새로고침 페이지
  if (loadError && playlist.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black text-white">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}>
            <svg viewBox="0 0 24 24" fill="#000" className="w-7 h-7"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#BEFF00' }}>머니터링 Pick</h1>
          <p className="text-[9px] text-zinc-500 tracking-wider uppercase mb-6">MONEYTORING PICK</p>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            서버에 연결할 수 없어요<br />
            인터넷 연결을 확인하고<br />
            다시 시도해주세요
          </p>
          <button
            onClick={() => { setLoading(true); setLoadError(false); loadTracks(); }}
            className="px-8 py-3 rounded-xl font-semibold text-black flex items-center gap-2 mx-auto"
            style={{ background: '#BEFF00' }}
          >
            <RefreshCw className="w-4 h-4" />
            다시 연결하기
          </button>
        </div>
      </div>
    );
  }

  const hasPlayer = !!currentTrack;


  return (
    <div className="h-dvh bg-black text-white flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="flex-1 flex flex-col min-h-0"
        style={{ paddingBottom: hasPlayer
          ? 'calc(56px + 72px + max(env(safe-area-inset-bottom, 0px), 8px))'
          : 'calc(56px + max(env(safe-area-inset-bottom, 0px), 8px))'
        }}>
        {activeTab === 'home' && briefingGroup === null && <HomePage onRefresh={loadTracks} onOpenBriefing={(gi: number) => setBriefingGroup(gi)} />}
        {activeTab === 'home' && briefingGroup !== null && <BriefingDetailPage initialGroup={briefingGroup} onBack={() => setBriefingGroup(null)} />}
        {/* 브리핑은 항상 마운트 — iframe 캐시 유지 */}
        <div className={activeTab === 'briefing' ? 'flex-1 min-h-0' : 'hidden'}>
          <BriefingPage />
        </div>
        {activeTab === 'search' && <SearchPage />}
        {activeTab === 'labs' && <LabsPage />}
        {activeTab === 'saved' && <SavedPage onRefresh={loadTracks} />}
      </div>
      <Player />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

    </div>
  );
}

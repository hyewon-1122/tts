'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ChevronDown, ChevronLeft, Play } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

interface Stock {
  name: string;
  theme: string;
  summary: string;
}

interface BriefingGroup {
  title: string;
  stocks: Stock[];
}

const GROUP_EMOJIS = ['🔥', '💰', '🚀', '⚡', '🌍', '💡', '🏭', '📊', '🛡️', '🎯'];

export default function BriefingPage() {
  const [groups, setGroups] = useState<BriefingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const { playlist, setTrack, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    fetch('/briefing-data.json')
      .then((r) => r.json())
      .then((data) => { setGroups(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // 해당 그룹의 종목들을 playlist에서 찾아서 재생
  const playGroup = (group: BriefingGroup) => {
    const stockNames = group.stocks.map((s) => s.name);
    const matchedTracks = playlist.filter((t) =>
      stockNames.some((name) => t.title.includes(name))
    );
    if (matchedTracks.length > 0) {
      setTrack(matchedTracks[0]);
      setIsPlaying(true);
    }
  };

  // 개별 종목 재생
  const playStock = (stockName: string) => {
    const matched = playlist.find((t) => t.title.includes(stockName));
    if (matched) {
      setTrack(matched);
      setIsPlaying(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100dvh - 200px)' }}>
        <div className="text-center px-8">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-base font-semibold text-white mb-2">브리핑이 없어요</p>
          <p className="text-sm text-zinc-400">곧 새로운 브리핑이 올라와요!</p>
        </div>
      </div>
    );
  }

  const totalStocks = groups.reduce((s, g) => s + g.stocks.length, 0);

  // ===== 그룹 선택됨 → 종목 리스트 =====
  if (selectedGroup !== null) {
    const group = groups[selectedGroup];
    const title = group.title.replace(/^\d+\s*/, '');
    const emoji = GROUP_EMOJIS[selectedGroup % GROUP_EMOJIS.length];

    return (
      <div className="min-h-screen bg-black">
        {/* 헤더 */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-lg z-10 px-4 pt-8 pb-4 border-b border-zinc-800/50">
          <button
            onClick={() => { setSelectedGroup(null); setExpandedStock(null); }}
            className="flex items-center gap-1 text-zinc-400 text-sm mb-3 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            전체 테마
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{title}</h1>
              <p className="text-xs text-zinc-500">{group.stocks.length}개 종목</p>
            </div>
            {/* 이 테마 전체 듣기 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => playGroup(group)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-black"
              style={{ background: '#BEFF00' }}
            >
              <Play className="w-3.5 h-3.5" fill="black" />
              전체 듣기
            </motion.button>
          </div>
        </div>

        {/* 종목 카드 리스트 */}
        <div className="px-4 py-4 space-y-3 pb-24">
          {group.stocks.map((stock, si) => {
            const key = `${selectedGroup}-${si}`;
            const isExpanded = expandedStock === key;

            return (
              <motion.div
                key={si}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: si * 0.03, type: 'spring', damping: 25 }}
                className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/50 overflow-hidden"
                style={{ boxShadow: isExpanded ? '0 0 30px rgba(190, 255, 0, 0.08)' : 'none' }}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-all"
                  onClick={() => setExpandedStock(isExpanded ? null : key)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-1">{stock.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">{stock.theme}</p>
                      <motion.div
                        className="flex items-center gap-1 text-xs text-zinc-500"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-3 h-3" />
                        <span>{isExpanded ? '접기' : '펼치기'}</span>
                      </motion.div>
                    </div>
                    {/* 개별 재생 버튼 */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); playStock(stock.name); }}
                      className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)', boxShadow: '0 4px 15px rgba(190, 255, 0, 0.2)' }}
                    >
                      <Play className="w-4 h-4 ml-0.5 text-black" fill="black" />
                    </motion.button>
                  </div>
                </div>

                {/* 상세 분석 */}
                <AnimatePresence>
                  {isExpanded && stock.summary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-zinc-800/50 bg-zinc-950/50 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-1 h-4 rounded-full"
                            style={{ backgroundColor: '#BEFF00' }}
                          />
                          <span className="text-xs font-semibold" style={{ color: '#BEFF00' }}>상세 분석</span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{stock.summary}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== 그룹 목록 =====
  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg z-10 px-4 pt-8 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 mb-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: '#BEFF00' }} />
          </motion.div>
          <h1 className="text-xl font-bold">이슈 종목 브리핑</h1>
        </div>
        <p className="text-sm text-zinc-400">
          지금 가장 뜨거운 종목들을 확인하세요 ({totalStocks}개)
        </p>
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {groups.map((group, gi) => {
          const title = group.title.replace(/^\d+\s*/, '');
          const emoji = GROUP_EMOJIS[gi % GROUP_EMOJIS.length];

          return (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05, type: 'spring', damping: 20 }}
              onClick={() => { setSelectedGroup(gi); setExpandedStock(null); }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/50 p-4 cursor-pointer hover:border-zinc-700/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="text-2xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }}
                >
                  {emoji}
                </motion.div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold leading-tight">{title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #BEFF00, transparent)' }} />
                    <span className="text-xs text-zinc-500">{group.stocks.length}개 종목</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); playGroup(group); }}
                  className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)', boxShadow: '0 4px 15px rgba(190, 255, 0, 0.2)' }}
                >
                  <Play className="w-4 h-4 ml-0.5 text-black" fill="black" />
                </motion.button>
              </div>
              {/* 종목 미리보기 */}
              <div className="flex flex-wrap gap-1.5">
                {group.stocks.slice(0, 4).map((s, si) => (
                  <span key={si} className="text-[11px] px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-400">
                    {s.name}
                  </span>
                ))}
                {group.stocks.length > 4 && (
                  <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-800/40 text-zinc-500">
                    +{group.stocks.length - 4}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* 하단 업데이트 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-xl p-4 border border-zinc-800/50 text-center mt-6"
        >
          <p className="text-xs text-zinc-500 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            실시간 업데이트 중
          </p>
          <p className="text-xs text-zinc-600">마지막 업데이트: 2026년 4월 6일 08:34</p>
        </motion.div>
      </div>
    </div>
  );
}

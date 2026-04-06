'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ChevronDown, Flame, Eye, Play } from 'lucide-react';

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
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  useEffect(() => {
    fetch('/briefing-data.json')
      .then((r) => r.json())
      .then((data) => { setGroups(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
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

      {/* Groups */}
      <div className="px-4 py-6 space-y-10 pb-24">
        {groups.map((group, gi) => {
          const title = group.title.replace(/^\d+\s*/, '');
          const emoji = GROUP_EMOJIS[gi % GROUP_EMOJIS.length];

          return (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1, type: 'spring', damping: 20 }}
            >
              {/* Group Header */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    className="text-3xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: gi * 0.3 }}
                  >
                    {emoji}
                  </motion.div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold leading-tight">{title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #BEFF00, transparent)' }} />
                      <span className="text-xs text-zinc-500">{group.stocks.length}개 종목</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stocks */}
              <div className="space-y-3">
                {group.stocks.map((stock, si) => {
                  const key = `${gi}-${si}`;
                  const isExpanded = expandedStock === key;

                  return (
                    <motion.div
                      key={si}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.1 + si * 0.03, type: 'spring', damping: 25 }}
                      className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/50 overflow-hidden"
                      style={{ boxShadow: isExpanded ? '0 0 30px rgba(190, 255, 0, 0.08)' : 'none' }}
                    >
                      {/* Stock Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-all relative overflow-hidden"
                        onClick={() => setExpandedStock(isExpanded ? null : key)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-bold text-sm">{stock.name}</h3>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">{stock.theme}</p>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <motion.div
                                className="flex items-center gap-1"
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown className="w-3 h-3" />
                                <span>{isExpanded ? '접기' : '펼치기'}</span>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Summary */}
                      <AnimatePresence>
                        {isExpanded && stock.summary && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-zinc-800/50 bg-zinc-950/50">
                              <div className="pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-1 h-4 rounded-full"
                                    style={{ backgroundColor: '#BEFF00' }}
                                  />
                                  <span className="text-xs font-semibold" style={{ color: '#BEFF00' }}>상세 분석</span>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                  {stock.summary}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Update Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-xl p-4 border border-zinc-800/50 text-center"
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

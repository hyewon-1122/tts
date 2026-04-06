'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

interface Stock {
  name: string;
  theme: string;
  summary: string;
}

interface BriefingGroup {
  title: string;
  stocks: Stock[];
}

// 그룹별 아이콘/색상
const GROUP_STYLES = [
  { emoji: '🔥', color: '#EF4444' },
  { emoji: '💰', color: '#F59E0B' },
  { emoji: '🚀', color: '#8B5CF6' },
  { emoji: '⚡', color: '#10B981' },
  { emoji: '🌍', color: '#3B82F6' },
  { emoji: '💡', color: '#EC4899' },
  { emoji: '🏭', color: '#06B6D4' },
  { emoji: '📊', color: '#F97316' },
  { emoji: '🛡️', color: '#6366F1' },
  { emoji: '🎯', color: '#14B8A6' },
];

export default function BriefingPage() {
  const [groups, setGroups] = useState<BriefingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [openStock, setOpenStock] = useState<string | null>(null);

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

  const toggleGroup = (index: number) => {
    setOpenGroup(openGroup === index ? null : index);
    setOpenStock(null);
  };

  const toggleStock = (key: string) => {
    setOpenStock(openStock === key ? null : key);
  };

  return (
    <div className="px-4 pt-8 pb-24">
      <h1 className="text-xl font-bold text-white mb-1">이슈 종목 브리핑</h1>
      <p className="text-sm text-zinc-400 mb-5">{groups.reduce((s, g) => s + g.stocks.length, 0)}개 종목 · {groups.length}개 테마</p>

      <div className="space-y-3">
        {groups.map((group, gi) => {
          const style = GROUP_STYLES[gi % GROUP_STYLES.length];
          const isOpen = openGroup === gi;
          // 그룹 제목에서 번호 제거
          const title = group.title.replace(/^\d+\s*/, '');

          return (
            <div key={gi} className="rounded-xl overflow-hidden border border-zinc-800">
              {/* 그룹 헤더 */}
              <button
                onClick={() => toggleGroup(gi)}
                className="w-full flex items-center gap-3 p-4 bg-zinc-900 hover:bg-zinc-800/80 transition-colors text-left"
              >
                <span className="text-2xl flex-shrink-0">{style.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                  <p className="text-xs text-zinc-500">{group.stocks.length}개 종목</p>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-zinc-500" />
                </motion.div>
              </button>

              {/* 종목 리스트 */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-black/30 divide-y divide-zinc-800/50">
                      {group.stocks.map((stock, si) => {
                        const stockKey = `${gi}-${si}`;
                        const isStockOpen = openStock === stockKey;

                        return (
                          <div key={si}>
                            <button
                              onClick={() => toggleStock(stockKey)}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                                style={{ background: style.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{stock.name}</p>
                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{stock.theme}</p>
                              </div>
                              <motion.div
                                animate={{ rotate: isStockOpen ? 180 : 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex-shrink-0 mt-1"
                              >
                                <ChevronDown className="w-4 h-4 text-zinc-600" />
                              </motion.div>
                            </button>

                            {/* 요약 전문 */}
                            <AnimatePresence>
                              {isStockOpen && stock.summary && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-3 pl-8">
                                    <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800/50">
                                      <pre className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                                        {stock.summary}
                                      </pre>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

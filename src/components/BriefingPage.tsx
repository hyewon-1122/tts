'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

  // 그룹 선택 안 됐으면 → 그룹 목록
  if (selectedGroup === null) {
    return (
      <div className="px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-white mb-1">이슈 종목 브리핑</h1>
        <p className="text-sm text-zinc-400 mb-5">
          {groups.reduce((s, g) => s + g.stocks.length, 0)}개 종목 · {groups.length}개 테마
        </p>

        <div className="space-y-2.5">
          {groups.map((group, gi) => {
            const title = group.title.replace(/^\d+\s*/, '');
            const emoji = GROUP_EMOJIS[gi % GROUP_EMOJIS.length];
            // 상위 3개 종목명 미리보기
            const preview = group.stocks.slice(0, 3).map((s) => s.name).join(', ');

            return (
              <motion.div
                key={gi}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.03 }}
                onClick={() => { setSelectedGroup(gi); setExpandedStock(null); }}
                className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden"
              >
                {/* 그룹 헤더 */}
                <div className="flex items-center gap-3 p-4 pb-3">
                  <span className="text-2xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-zinc-500">{group.stocks.length}개 종목</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                </div>

                {/* 종목 미리보기 */}
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {group.stocks.slice(0, 5).map((s, si) => (
                      <span key={si} className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-400">
                        {s.name}
                      </span>
                    ))}
                    {group.stocks.length > 5 && (
                      <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-500">
                        +{group.stocks.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // 그룹 선택됨 → 종목 리스트
  const group = groups[selectedGroup];
  const title = group.title.replace(/^\d+\s*/, '');
  const emoji = GROUP_EMOJIS[selectedGroup % GROUP_EMOJIS.length];

  return (
    <div className="px-4 pt-8 pb-24">
      {/* 뒤로가기 헤더 */}
      <button
        onClick={() => setSelectedGroup(null)}
        className="flex items-center gap-2 text-zinc-400 text-sm mb-4 hover:text-white transition-colors"
      >
        <ChevronDown className="w-4 h-4 rotate-90" />
        전체 테마
      </button>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{emoji}</span>
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-5">{group.stocks.length}개 종목</p>

      {/* 종목 카드 리스트 */}
      <div className="space-y-2.5">
        {group.stocks.map((stock, si) => {
          const key = `${selectedGroup}-${si}`;
          const isExpanded = expandedStock === key;
          // 요약 첫 2줄 추출
          const summaryLines = stock.summary.split('\n').filter((l) => l.trim());
          const shortSummary = summaryLines.slice(0, 1).join(' ').replace(/\*\*/g, '').slice(0, 80);

          return (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.02 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
            >
              <button
                onClick={() => setExpandedStock(isExpanded ? null : key)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{stock.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#BEFF00' }}>{stock.theme}</p>
                    {!isExpanded && shortSummary && (
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{shortSummary}...</p>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-shrink-0 mt-1"
                  >
                    <ChevronDown className="w-4 h-4 text-zinc-600" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && stock.summary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <div className="bg-zinc-950 rounded-lg p-3">
                        <pre className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                          {stock.summary}
                        </pre>
                      </div>
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

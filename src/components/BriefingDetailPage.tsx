'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

interface Stock { name: string; theme: string; summary: string; }
interface BriefingGroupData { title: string; stocks: Stock[]; }

const GROUP_EMOJIS = ['🔥', '💰', '🚀', '⚡', '🌍', '💡', '🏭', '📊', '🛡️', '🎯'];

interface Props {
  initialGroup?: number;
  onBack: () => void;
}

export default function BriefingDetailPage({ initialGroup, onBack }: Props) {
  const [groups, setGroups] = useState<BriefingGroupData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState(initialGroup ?? 0);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const { playlist, resetQueueAndPlay, appendToQueue } = usePlayerStore();

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

  const playStock = (name: string) => {
    const matched = playlist.find((t) => t.title.includes(name));
    if (matched) appendToQueue(matched);
  };

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[#BEFF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  const group = groups[selectedGroup] || groups[0];
  const title = group.title.replace(/^\d+\s*/, '');
  const emoji = GROUP_EMOJIS[selectedGroup % GROUP_EMOJIS.length];

  return (
    <div className="flex flex-col h-full">
      {/* 고정 헤더 */}
      <div className="flex-shrink-0 bg-black z-10 px-4 pt-8 pb-3 border-b border-zinc-800/50">
        <button onClick={onBack}
          className="flex items-center gap-1 text-zinc-400 text-sm mb-3 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          홈으로
        </button>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{emoji}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-xs text-zinc-500">{group.stocks.length}개 종목</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => playGroup(group)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-black"
            style={{ background: '#BEFF00' }}>
            <Play className="w-3.5 h-3.5" fill="black" />전체 듣기
          </motion.button>
        </div>

        {/* 그룹 탭 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {groups.map((g, i) => {
            const isActive = selectedGroup === i;
            const gTitle = g.title.replace(/^\d+\s*/, '');
            return (
              <button key={i} onClick={() => { setSelectedGroup(i); setExpandedStock(null); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                style={isActive ? { background: '#BEFF00' } : {}}>
                <span className="text-sm">{GROUP_EMOJIS[i % GROUP_EMOJIS.length]}</span>
                {gTitle.length > 8 ? gTitle.slice(0, 8) + '…' : gTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* 종목 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-2.5">
        {group.stocks.map((stock, si) => {
          const key = `${selectedGroup}-${si}`;
          const isExp = expandedStock === key;
          return (
            <motion.div key={si}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.02 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/50 overflow-hidden"
              style={{ boxShadow: isExp ? '0 0 20px rgba(190,255,0,0.06)' : 'none' }}>
              <div className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-all"
                onClick={() => setExpandedStock(isExp ? null : key)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1">{stock.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">{stock.theme}</p>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <motion.div animate={{ rotate: isExp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M6 9l6 6 6-6"/></svg>
                      </motion.div>
                      <span>{isExp ? '접기' : '펼치기'}</span>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); playStock(stock.name); }}
                    className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}>
                    <Play className="w-4 h-4 ml-0.5 text-black" fill="black" />
                  </motion.button>
                </div>
              </div>
              <AnimatePresence>
                {isExp && stock.summary && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-zinc-800/50 bg-zinc-950/50 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#BEFF00' }} />
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

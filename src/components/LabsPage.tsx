'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { FlaskConical, Play } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { getCategoryLabel, getCategoryColor, getCategoryIcon, categories } from '@/lib/categories';
import Image from 'next/image';

export default function LabsPage() {
  const { playlist, setTrack, setIsPlaying, currentTrack } = usePlayerStore();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? playlist.filter((t) => t.category === filter) : playlist;

  return (
    <div className="flex flex-col h-full">
      {/* 고정 헤더 */}
      <div className="flex-shrink-0 bg-black z-10 px-4 pt-8 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5" style={{ color: '#BEFF00' }} />
          <h1 className="text-xl font-bold">머니터링 Labs</h1>
        </div>
        <p className="text-sm text-zinc-400 mb-4">모든 TTS 브리핑을 탐색해보세요</p>

        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!filter ? 'text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            style={!filter ? { background: '#BEFF00' } : {}}>전체 ({playlist.length})</button>
          {categories.map((cat) => {
            const count = playlist.filter((t) => t.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button key={cat.id} onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === cat.id ? 'text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                style={filter === cat.id ? { background: '#BEFF00' } : {}}>{cat.label} ({count})</button>
            );
          })}
        </div>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🧪</div>
            <p className="text-base font-semibold text-white mb-2">브리핑이 없어요</p>
            <p className="text-sm text-zinc-400">곧 새로운 실험이 시작돼요!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              const catColor = getCategoryColor(track.category);
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => { setTrack(track); setIsPlaying(true); }}
                  className="bg-zinc-900 rounded-xl p-3.5 border border-zinc-800 hover:border-zinc-700 cursor-pointer flex items-center gap-3 transition-all"
                >
                  <div className="w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden relative">
                    <Image src={getCategoryIcon(track.category)} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCurrent ? '' : 'text-white'}`}
                      style={isCurrent ? { color: '#BEFF00' } : {}}>
                      {track.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${catColor}20`, color: catColor }}>
                        {getCategoryLabel(track.category)}
                      </span>
                      <span className="text-[10px] text-zinc-500">{track.date}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #BEFF00, #8FBF00)' }}>
                    <Play className="w-3.5 h-3.5 ml-0.5 text-black" fill="black" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

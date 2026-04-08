'use client';

import { Home, Radio, Search, BookmarkCheck, Clapperboard, ListMusic, FileText, FlaskConical } from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'briefing', label: '무드미러', icon: FileText },
  { id: 'search', label: '검색', icon: Search },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'saved', label: '리스트', icon: ListMusic },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-40"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
      <div className="max-w-lg mx-auto flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-2 transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" fill={isActive ? 'currentColor' : 'none'} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import Player from '@/components/Player';
import Playlist from '@/components/Playlist';
import LyricsView from '@/components/LyricsView';

// 데모 데이터
const DEMO_TRACKS: Track[] = [
  {
    id: 'demo-1',
    title: '4월 1일 시황 브리핑 - 코스피 3일 연속 상승',
    category: '시황',
    date: '2026-04-01',
    duration: 45,
    audioUrl: '/demo/sample.mp3',
    content: {
      title: '4월 1일 시황 브리핑 - 코스피 3일 연속 상승',
      category: '시황',
      date: '2026-04-01',
      duration: 45,
      text: '',
      lines: [
        { time: 0, text: '안녕하세요, 4월 1일 시황 브리핑을 시작하겠습니다.' },
        { time: 3, text: '오늘 코스피는 전일 대비 1.2% 상승한' },
        { time: 6, text: '2,850포인트에 마감했습니다.' },
        { time: 9, text: '3일 연속 상승세를 이어가며' },
        { time: 12, text: '외국인 매수세가 시장을 견인했습니다.' },
        { time: 15, text: '특히 반도체 섹터가 강세를 보이며' },
        { time: 18, text: '삼성전자가 2.3% 상승했고' },
        { time: 21, text: 'SK하이닉스도 3.1% 올랐습니다.' },
        { time: 24, text: '코스닥은 0.8% 상승한 920포인트를 기록했습니다.' },
        { time: 27, text: '미국 시장의 긍정적 흐름이' },
        { time: 30, text: '국내 증시에도 호재로 작용했습니다.' },
        { time: 33, text: '다우존스가 전일 0.5% 상승 마감했으며' },
        { time: 36, text: '나스닥도 0.8% 올랐습니다.' },
        { time: 39, text: '내일은 미국 고용지표 발표가 예정되어 있어' },
        { time: 42, text: '변동성이 확대될 수 있으니 주의가 필요합니다.' },
      ],
    },
    createdAt: '2026-04-01T09:00:00',
  },
  {
    id: 'demo-2',
    title: '삼성전자 실적 프리뷰 - 반도체 호황 지속',
    category: '종목',
    date: '2026-04-01',
    duration: 38,
    audioUrl: '/demo/sample.mp3',
    content: {
      title: '삼성전자 실적 프리뷰 - 반도체 호황 지속',
      category: '종목',
      date: '2026-04-01',
      duration: 38,
      text: '',
      lines: [
        { time: 0, text: '삼성전자 1분기 실적 프리뷰입니다.' },
        { time: 3, text: '증권가 컨센서스에 따르면' },
        { time: 6, text: '1분기 매출은 약 78조원으로 예상됩니다.' },
        { time: 9, text: '영업이익은 약 9.5조원으로' },
        { time: 12, text: '전분기 대비 15% 증가할 것으로 보입니다.' },
        { time: 15, text: 'HBM3E 양산이 본격화되면서' },
        { time: 18, text: '반도체 부문 수익성이 크게 개선되었습니다.' },
        { time: 21, text: 'AI 서버향 수요가 지속적으로 증가하고 있으며' },
        { time: 24, text: '엔비디아 향 HBM 공급 계약도 확대 중입니다.' },
        { time: 27, text: '다만 파운드리 부문은 여전히 적자가 이어지고 있어' },
        { time: 30, text: '전체 실적에는 부담 요인으로 작용할 수 있습니다.' },
        { time: 33, text: '실적 발표는 4월 8일로 예정되어 있습니다.' },
        { time: 36, text: '투자에 참고하시기 바랍니다.' },
      ],
    },
    createdAt: '2026-04-01T10:00:00',
  },
  {
    id: 'demo-3',
    title: 'AI 반도체 테마 분석 - HBM 수혜주 점검',
    category: '테마',
    date: '2026-03-31',
    duration: 42,
    audioUrl: '/demo/sample.mp3',
    content: {
      title: 'AI 반도체 테마 분석 - HBM 수혜주 점검',
      category: '테마',
      date: '2026-03-31',
      duration: 42,
      text: '',
      lines: [
        { time: 0, text: 'AI 반도체 테마 분석을 시작하겠습니다.' },
        { time: 3, text: '최근 AI 서버 수요 증가로' },
        { time: 6, text: 'HBM 관련주가 강세를 보이고 있습니다.' },
        { time: 9, text: 'SK하이닉스는 HBM3E 양산에 성공하며' },
        { time: 12, text: '글로벌 시장 점유율 1위를 유지하고 있습니다.' },
        { time: 15, text: '관련 후공정 업체인 한미반도체는' },
        { time: 18, text: 'TC 본더 수주가 크게 증가했습니다.' },
        { time: 21, text: 'ISC와 리노공업 등 테스트 소켓 업체도' },
        { time: 24, text: '수혜가 기대됩니다.' },
        { time: 27, text: '다만 단기 급등에 따른 조정 가능성도 있으므로' },
        { time: 30, text: '분할 매수 전략을 권장합니다.' },
        { time: 33, text: '중장기적으로 AI 투자는' },
        { time: 36, text: '구조적 성장 트렌드로 판단됩니다.' },
        { time: 39, text: '관련 종목 모니터링을 지속해주시기 바랍니다.' },
      ],
    },
    createdAt: '2026-03-31T09:00:00',
  },
  {
    id: 'demo-4',
    title: '3월 31일 시황 마감 - 외국인 순매수 확대',
    category: '시황',
    date: '2026-03-31',
    duration: 35,
    audioUrl: '/demo/sample.mp3',
    content: {
      title: '3월 31일 시황 마감 - 외국인 순매수 확대',
      category: '시황',
      date: '2026-03-31',
      duration: 35,
      text: '',
      lines: [
        { time: 0, text: '3월 31일 시황 마감 브리핑입니다.' },
        { time: 3, text: '코스피는 전일 대비 0.7% 상승한' },
        { time: 6, text: '2,816포인트에 마감했습니다.' },
        { time: 9, text: '외국인이 3,200억원 순매수하며' },
        { time: 12, text: '5거래일 연속 매수세를 이어갔습니다.' },
        { time: 15, text: '업종별로는 전기전자, 화학 업종이 강세였고' },
        { time: 18, text: '건설, 운수 업종은 약세를 보였습니다.' },
        { time: 21, text: '원달러 환율은 1,350원대에서 안정세를 유지했습니다.' },
        { time: 24, text: '내일 4월 첫 거래일은' },
        { time: 27, text: '기관 리밸런싱 수급에 주목할 필요가 있습니다.' },
        { time: 30, text: '좋은 투자 되시기 바랍니다.' },
      ],
    },
    createdAt: '2026-03-31T16:00:00',
  },
  {
    id: 'demo-5',
    title: '현대차 이슈 - 美 관세 영향 분석',
    category: '이슈',
    date: '2026-03-30',
    duration: 40,
    audioUrl: '/demo/sample.mp3',
    content: {
      title: '현대차 이슈 - 美 관세 영향 분석',
      category: '이슈',
      date: '2026-03-30',
      duration: 40,
      text: '',
      lines: [
        { time: 0, text: '현대차 관련 이슈 분석입니다.' },
        { time: 3, text: '미국 자동차 관세 인상안이 발표되면서' },
        { time: 6, text: '현대차 주가에 미치는 영향을 점검합니다.' },
        { time: 9, text: '관세율은 기존 2.5%에서 25%로' },
        { time: 12, text: '대폭 인상이 예상됩니다.' },
        { time: 15, text: '현대차의 미국 수출 비중은 약 15%로' },
        { time: 18, text: '단기적으로는 부정적 영향이 불가피합니다.' },
        { time: 21, text: '다만 앨라배마 공장 증설을 통해' },
        { time: 24, text: '현지 생산 비율을 높이고 있어' },
        { time: 27, text: '중장기적 영향은 제한적일 수 있습니다.' },
        { time: 30, text: 'EV 라인업 강화와 함께' },
        { time: 33, text: 'IRA 보조금 혜택도 긍정적 요인입니다.' },
        { time: 36, text: '투자 판단에 참고하시기 바랍니다.' },
      ],
    },
    createdAt: '2026-03-30T11:00:00',
  },
];

type MobileTab = 'playlist' | 'lyrics';

export default function Home() {
  const { setPlaylist, currentTrack } = usePlayerStore();
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('playlist');

  // 트랙 선택 시 모바일에서 자동으로 가사 뷰로 전환
  useEffect(() => {
    if (currentTrack) setMobileTab('lyrics');
  }, [currentTrack?.id]);

  useEffect(() => {
    async function loadTracks() {
      try {
        const res = await apiFetch('/api/tracks');
        if (res.ok) {
          const tracks: Track[] = await res.json();
          if (tracks.length > 0) {
            setPlaylist(tracks);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API 실패 시 데모 데이터 사용
      }
      setPlaylist(DEMO_TRACKS);
      setLoading(false);
    }
    loadTracks();
  }, [setPlaylist]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 text-sm mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-gray-950">
      {/* 모바일 탭 바 (lg 이상에서 숨김) */}
      <div className="flex lg:hidden border-b border-gray-800">
        <button
          onClick={() => setMobileTab('playlist')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors
            ${mobileTab === 'playlist'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400'
            }`}
        >
          플레이리스트
        </button>
        <button
          onClick={() => setMobileTab('lyrics')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors
            ${mobileTab === 'lyrics'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400'
            }`}
        >
          가사
        </button>
      </div>

      {/* PC: 좌우 분할 / 모바일: 탭 전환 */}
      <div className="flex-1 flex min-h-0">
        {/* 플레이리스트 - 모바일: 탭 활성화 시만, PC: 항상 */}
        <div className={`${mobileTab === 'playlist' ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto`}>
          <Playlist />
        </div>
        {/* 가사뷰 - 모바일: 탭 활성화 시만, PC: 항상 */}
        <div className={`${mobileTab === 'lyrics' ? 'flex' : 'hidden'} lg:flex flex-1`}>
          <LyricsView />
        </div>
      </div>

      <Player />
    </div>
  );
}

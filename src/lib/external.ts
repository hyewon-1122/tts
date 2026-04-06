import { Track } from './types';
import { parseId3Title } from './id3';

const BASE_URL = process.env.EXTERNAL_API_BASE || 'https://estefana-islandlike-nebuly.ngrok-free.dev';
const TTS_PATH = '/market_update/tts';
const SCENARIO_PATH = '/market_update/scenario';

// 체크할 시간대 (실제 올라오는 시간대 위주)
const TIME_SLOTS = ['0600', '0700', '0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300'];

const DAYS_TO_CHECK = 3;

function getDateRange(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < DAYS_TO_CHECK; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/** GET 요청으로 존재 여부 확인 — ngrok HEAD 요청 이슈 우회 */
async function fileExists(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'MoneytoringPick/1.0',
      },
      signal: controller.signal,
    });
    // 200 또는 206(partial) 모두 OK
    return res.status === 200 || res.status === 206;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      signal: controller.signal,
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function fetchId3Title(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: { Range: 'bytes=0-16383', 'ngrok-skip-browser-warning': 'true' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    const slice = ab.byteLength > 16384 ? ab.slice(0, 16384) : ab;
    return parseId3Title(Buffer.from(slice));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 메모리 캐시 — Vercel 서버리스 인스턴스 내에서 유지
let cachedTracks: Track[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60초

/**
 * 외부 서버에서 트랙 스캔 (캐시 포함)
 */
export async function listExternalTracks(): Promise<Track[]> {
  // 캐시가 유효하면 바로 반환
  if (cachedTracks && Date.now() - cacheTime < CACHE_TTL) {
    return cachedTracks;
  }

  try {
    const result = await _scanExternalTracks();
    if (result.length > 0) {
      cachedTracks = result;
      cacheTime = Date.now();
    }
    return result;
  } catch {
    // 스캔 실패 시 이전 캐시 반환
    return cachedTracks || [];
  }
}

async function _scanExternalTracks(): Promise<Track[]> {
  const dates = getDateRange();

  // 모든 조합을 한번에 병렬 체크
  const allCandidates = dates.flatMap((date) =>
    TIME_SLOTS.map((time) => ({
      date,
      time,
      mp3Url: `${BASE_URL}${TTS_PATH}/media_scenario_${date}_${time}.mp3`,
    }))
  );

  const checks = await Promise.all(
    allCandidates.map(async (c) => ({
      ...c,
      exists: await fileExists(c.mp3Url),
    }))
  );

  const found = checks.filter((c) => c.exists);

  // 발견된 파일들의 텍스트 + ID3 병렬 로드
  const allTracks = await Promise.all(
    found.map(async (f) => {
      const mdUrl = `${BASE_URL}${SCENARIO_PATH}/scenario_${f.date}_${f.time}.md`;
      const [rawText, id3Title] = await Promise.all([
        fetchText(mdUrl),
        fetchId3Title(f.mp3Url),
      ]);

      const timeLabel = `${f.time.slice(0, 2)}시`;
      const title = id3Title || `[${f.date}] ${timeLabel} 브리핑`;

      return {
        id: `ext_${f.date}_${f.time}`,
        title,
        category: 'today_market',
        date: f.date,
        duration: 0,
        audioUrl: `/api/proxy?url=${encodeURIComponent(f.mp3Url)}`,
        content: {
          title,
          category: 'today_market',
          date: f.date,
          duration: 0,
          text: rawText,
          lines: [],
        },
        createdAt: `${f.date}T${f.time.slice(0, 2)}:${f.time.slice(2)}:00`,
      } as Track;
    })
  );

  allTracks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return allTracks;
}

import { NextResponse } from 'next/server';

export const maxDuration = 30;

const BASE = process.env.EXTERNAL_API_BASE || 'https://ip-10-0-0-11.taile4e502.ts.net';
const MARKET_TTS = '/market_update/tts';
const MARKET_SCN = '/market_update/scenario';
const STOCK_TTS = '/issue_stock/tts';
const STOCK_SCN = '/issue_stock/scenario';

async function getText(url: string): Promise<string> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 5000);
  try {
    const r = await fetch(url, { signal: c.signal });
    return r.ok ? await r.text() : '';
  } catch { return ''; } finally { clearTimeout(t); }
}

/** HTML 디렉토리 리스팅에서 파일명 추출 */
function parseDir(html: string, ext: string): string[] {
  const regex = new RegExp(`href="([^"]*\\.${ext})"`, 'g');
  const files: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    files.push(decodeURIComponent(m[1]));
  }
  return files;
}

/** 시나리오 파일 목록에서 date+time 기준으로 매칭 */
function buildScenarioMap(mdFiles: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of mdFiles) {
    // scenario_2026-04-07_1500_claude-opus-4-6.md → key: "2026-04-07_1500"
    const m = f.match(/scenario_(\d{4}-\d{2}-\d{2}_\d{4})/);
    if (m) map.set(m[1], f);
  }
  return map;
}

export async function GET() {
  // === 1) 시황: 디렉토리 리스팅 ===
  let marketTracks: {
    id: string; title: string; category: string; date: string; duration: number;
    audioUrl: string; textUrl: string;
    content: { title: string; category: string; date: string; duration: number; text: string; srt: string; lines: never[] };
    createdAt: string;
  }[] = [];

  try {
    const [ttsHtml, scnHtml] = await Promise.all([
      getText(`${BASE}${MARKET_TTS}/`),
      getText(`${BASE}${MARKET_SCN}/`),
    ]);
    const mp3Files = parseDir(ttsHtml, 'mp3');
    const mdFiles = parseDir(scnHtml, 'md');
    const scenarioMap = buildScenarioMap(mdFiles);

    marketTracks = mp3Files.map(fileName => {
      const mp3 = `${BASE}${MARKET_TTS}/${encodeURIComponent(fileName)}`;

      // media_scenario_2026-04-07_1100_gpt-5-mini.mp3
      // media_scenario_weekly_2026-04-06_0700.mp3
      const dateTimeMatch = fileName.match(/(\d{4}-\d{2}-\d{2})_(\d{4})/);
      const date = dateTimeMatch ? dateTimeMatch[1] : new Date().toISOString().split('T')[0];
      const time = dateTimeMatch ? dateTimeMatch[2] : '0000';
      const h = time.slice(0, 2);
      const key = `${date}_${time}`;

      // 타이틀: weekly이면 주간, 모델 접미사 표시
      const isWeekly = fileName.includes('_weekly_');
      const modelMatch = fileName.match(/\d{4}_([a-z0-9-]+)\.mp3$/);
      const modelSuffix = modelMatch && !['mp3'].includes(modelMatch[1]) ? modelMatch[1] : '';

      let title = isWeekly ? `[${date}] 주간 브리핑` : `[${date}] ${h}시 브리핑`;
      if (modelSuffix) title += ` (${modelSuffix})`;

      // 시나리오 매칭: key로 찾기
      const scenarioFile = scenarioMap.get(key);
      const textUrl = scenarioFile
        ? `${BASE}${MARKET_SCN}/${encodeURIComponent(scenarioFile)}`
        : `${BASE}${MARKET_SCN}/scenario_${key}.md`;

      return {
        id: `market_${key}${modelSuffix ? '_' + modelSuffix : ''}`,
        title, category: 'today_market', date, duration: 0,
        audioUrl: `/api/proxy?url=${encodeURIComponent(mp3)}`,
        textUrl,
        content: { title, category: 'today_market', date, duration: 0, text: '', srt: '', lines: [] as never[] },
        createdAt: `${date}T${h}:${time.slice(2)}:00`,
      };
    });
  } catch { /* */ }

  // === 2) 종목: 디렉토리 리스팅 ===
  let stockTracks: typeof marketTracks = [];
  try {
    const listHtml = await getText(`${BASE}${STOCK_TTS}/`);
    const mp3Files = parseDir(listHtml, 'mp3');

    stockTracks = mp3Files.map(fileName => {
      const mp3 = `${BASE}${STOCK_TTS}/${encodeURIComponent(fileName)}`;
      const stockName = fileName.replace(/\.mp3$/, '').replace(/^media_scenario_issue_/, '').replace(/_/g, ' ');
      const mdName = fileName.replace(/\.mp3$/, '.md').replace(/^media_/, '');
      const today = new Date().toISOString().split('T')[0];
      return {
        id: `stock_${stockName}`, title: stockName, category: 'stock', date: today, duration: 0,
        audioUrl: `/api/proxy?url=${encodeURIComponent(mp3)}`,
        textUrl: `${BASE}${STOCK_SCN}/${encodeURIComponent(mdName)}`,
        content: { title: stockName, category: 'stock', date: today, duration: 0, text: '', srt: '', lines: [] as never[] },
        createdAt: new Date().toISOString(),
      };
    });
  } catch { /* */ }

  // === 합치기 ===
  const allTracks = [...marketTracks, ...stockTracks];
  allTracks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json(allTracks, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

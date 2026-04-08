import { NextResponse } from 'next/server';

export const maxDuration = 30;

const BASE = process.env.EXTERNAL_API_BASE || 'https://ip-10-0-0-11.taile4e502.ts.net';
const MARKET_TTS = '/market_update/tts';
const MARKET_SCN = '/market_update/scenario';
const STOCK_TTS = '/issue_stock/tts';
const STOCK_SCN = '/issue_stock/scenario';
const SLOTS = ['0600','0700','0800','0900','1000','1100','1200','1300','1400','1500','1600','1700','1800','1900','2000','2100','2200','2300'];
const DAYS = 2;

async function check(url: string): Promise<boolean> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 3000);
  try {
    const r = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: c.signal });
    return r.status === 200 || r.status === 206;
  } catch { return false; } finally { clearTimeout(t); }
}

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

export async function GET() {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // === 1) 시황: 날짜+시간 패턴 스캔 ===
  const marketCandidates = dates.flatMap(date => SLOTS.map(time => ({ date, time })));
  const marketChecks = await Promise.all(marketCandidates.map(async c => ({
    ...c, ok: await check(`${BASE}${MARKET_TTS}/media_scenario_${c.date}_${c.time}.mp3`),
  })));

  const marketTracks = marketChecks.filter(c => c.ok).map(f => {
    const mp3 = `${BASE}${MARKET_TTS}/media_scenario_${f.date}_${f.time}.mp3`;
    const h = f.time.slice(0, 2);
    const title = `[${f.date}] ${h}시 브리핑`;
    return {
      id: `market_${f.date}_${f.time}`, title, category: 'today_market', date: f.date, duration: 0,
      audioUrl: `/api/proxy?url=${encodeURIComponent(mp3)}`,
      textUrl: `${BASE}${MARKET_SCN}/scenario_${f.date}_${f.time}.md`,
      content: { title, category: 'today_market', date: f.date, duration: 0, text: '', srt: '', lines: [] },
      createdAt: `${f.date}T${h}:${f.time.slice(2)}:00`,
    };
  });

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
        content: { title: stockName, category: 'stock', date: today, duration: 0, text: '', srt: '', lines: [] },
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

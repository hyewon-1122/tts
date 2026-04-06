import { NextResponse } from 'next/server';
import { getDrive } from '@/lib/gdrive';

export const maxDuration = 30;

// 기존 TTS 루트 폴더의 서브폴더 ID
const MARKET_FOLDER = '1PaNQ326Kvs-4wx1oeO6-kKWF5Vxit3SQ'; // market (시황+종목 혼합)
const STOCK_FOLDER = '1baxlp2Kv3_m0cdFz-p88kyPAOVVlxtHZ';  // stock
const FOLDER_MIME = 'application/vnd.google-apps.folder';

interface GFile { id: string; name: string; mimeType: string; modifiedTime: string; }

async function listFiles(folderId: string): Promise<GFile[]> {
  const drive = getDrive();
  const files: GFile[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 200, pageToken,
    });
    for (const f of res.data.files || []) {
      files.push({ id: f.id!, name: f.name!, mimeType: f.mimeType!, modifiedTime: f.modifiedTime! });
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

async function readText(fileId: string): Promise<string> {
  try {
    const drive = getDrive();
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return res.data as string;
  } catch { return ''; }
}

/** ID3v2 TIT2 파싱 */
function parseId3(buf: Buffer): string | null {
  if (buf.length < 10 || buf[0]!==0x49||buf[1]!==0x44||buf[2]!==0x33) return null;
  const ver = buf[3];
  const tagSize = ((buf[6]&0x7f)<<21)|((buf[7]&0x7f)<<14)|((buf[8]&0x7f)<<7)|(buf[9]&0x7f);
  let pos = 10;
  while (pos + 10 < Math.min(10+tagSize, buf.length)) {
    const fid = buf.subarray(pos,pos+4).toString('ascii');
    const fsize = ver===4 ? ((buf[pos+4]&0x7f)<<21)|((buf[pos+5]&0x7f)<<14)|((buf[pos+6]&0x7f)<<7)|(buf[pos+7]&0x7f) : buf.readUInt32BE(pos+4);
    if (fsize<=0||fsize>10000) break;
    if (fid==='TIT2') {
      const enc = buf[pos+10];
      const data = buf.subarray(pos+11, pos+10+fsize);
      if (enc===3) return data.toString('utf-8').replace(/\0/g,'').trim();
      if (enc===0) return data.toString('latin1').replace(/\0/g,'').trim();
      if (enc===1||enc===2) {
        // UTF-16
        const hasBom = data.length>=2&&((data[0]===0xff&&data[1]===0xfe)||(data[0]===0xfe&&data[1]===0xff));
        const start = hasBom?2:0;
        const isLE = hasBom?data[0]===0xff:true;
        let s = '';
        for (let j=start;j+1<data.length;j+=2) {
          const code = isLE?data[j]|(data[j+1]<<8):(data[j]<<8)|data[j+1];
          if (code===0) break;
          s += String.fromCharCode(code);
        }
        return s.trim();
      }
    }
    pos += 10 + fsize;
  }
  return null;
}

async function readId3(fileId: string): Promise<string | null> {
  try {
    const drive = getDrive();
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer', headers: { Range: 'bytes=0-16383' } });
    return parseId3(Buffer.from(res.data as ArrayBuffer));
  } catch { return null; }
}

/** 폴더(하위 포함)에서 모든 파일 수집 */
async function collectAllFiles(folderId: string): Promise<GFile[]> {
  const rootFiles = await listFiles(folderId);
  const subFolders = rootFiles.filter(f => f.mimeType === FOLDER_MIME);
  const nonFolders = rootFiles.filter(f => f.mimeType !== FOLDER_MIME);

  // 하위 폴더 병렬 탐색
  const subResults = await Promise.all(subFolders.map(f => listFiles(f.id)));
  return [...nonFolders, ...subResults.flat()];
}

/** 파일 이름에서 카테고리+제목 추출 */
function parseFileName(name: string): { category: string; title: string; key: string } {
  const baseName = name.replace(/\.[^.]+$/, '');
  const key = baseName.replace(/^media_/, '');

  // 종목: scenario_issue_흥아해운 → stock / 흥아해운
  if (key.includes('_issue_')) {
    const title = key.replace(/^scenario_issue_/, '').replace(/^media_scenario_issue_/, '').replace(/_/g, ' ');
    return { category: 'stock', title, key: key.replace(/^media_/, '') };
  }

  // 시황: scenario_2026-04-02_1300 → today_market / [2026-04-02] 13시 브리핑
  const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})_(\d{2})\d{2}/);
  if (dateMatch) {
    return { category: 'today_market', title: `[${dateMatch[1]}] 톰과 제리의 머니터링 오늘 (${dateMatch[2]}시 브리핑)`, key: key.replace(/^media_/, '') };
  }

  return { category: 'today_market', title: baseName, key };
}

export async function GET() {
  try {
    // 두 폴더 병렬 로드
    const [marketFiles, stockFiles] = await Promise.all([
      collectAllFiles(MARKET_FOLDER).catch(() => []),
      collectAllFiles(STOCK_FOLDER).catch(() => []),
    ]);

    const allFiles = [...marketFiles, ...stockFiles];

    // mp3 + md 매칭
    const audioMap = new Map<string, GFile>();
    const textMap = new Map<string, GFile>();

    for (const f of allFiles) {
      if (f.name === '.DS_Store') continue;
      const ext = f.name.replace(/^.*\./, '.').toLowerCase();
      const { key } = parseFileName(f.name);

      if (ext === '.mp3' || ext === '.wav' || ext === '.m4a') {
        audioMap.set(key, f);
      } else if (ext === '.md' || ext === '.txt') {
        textMap.set(key, f);
      }
    }

    // 매칭된 쌍만 추출
    const pairs: Array<{ key: string; audio: GFile; text?: GFile }> = [];
    for (const [key, audio] of audioMap) {
      pairs.push({ key, audio, text: textMap.get(key) });
    }

    // 텍스트 병렬 로드 (8개씩 배치)
    const BATCH = 8;
    const tracks: Array<Record<string, unknown>> = [];

    for (let i = 0; i < pairs.length; i += BATCH) {
      const batch = pairs.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async (p) => {
        const { category, title } = parseFileName(p.audio.name);

        // 날짜+시간을 파일명에서 추출
        const titleOrFile = p.audio.name;
        const dtMatch = titleOrFile.match(/(\d{4}-\d{2}-\d{2})[^\d]*(\d{2})시/);
        const fnMatch = p.audio.name.match(/(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})/);

        let date: string;
        let createdAt: string;

        if (dtMatch) {
          date = dtMatch[1];
          createdAt = `${dtMatch[1]}T${dtMatch[2]}:00:00`;
        } else if (fnMatch) {
          date = fnMatch[1];
          createdAt = `${fnMatch[1]}T${fnMatch[2]}:${fnMatch[3]}:00`;
        } else {
          const dm = p.audio.modifiedTime?.match(/\d{4}-\d{2}-\d{2}/);
          date = dm ? dm[0] : new Date().toISOString().split('T')[0];
          createdAt = p.audio.modifiedTime || new Date().toISOString();
        }

        return {
          id: `${category}_${p.audio.id}`, title, category, date, duration: 0,
          audioUrl: `/api/audio/${p.audio.id}`,
          textFileId: p.text?.id || '',
          content: { title, category, date, duration: 0, text: '', srt: '', lines: [] },
          createdAt,
        };
      }));
      tracks.push(...results);
    }

    tracks.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    return NextResponse.json(tracks, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

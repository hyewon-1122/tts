import { google, drive_v3 } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

let driveClient: drive_v3.Drive | null = null;

function getCredentials(): Record<string, unknown> {
  // 1) Base64 인코딩된 환경변수 (Vercel 등 서버리스)
  if (process.env.GOOGLE_CREDENTIALS_B64) {
    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }
  // 2) 일반 JSON 환경변수
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  // 3) 로컬 파일
  const credPath = path.join(process.cwd(), 'credentials.json');
  if (fs.existsSync(credPath)) {
    return JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  }
  throw new Error(
    'Google credentials not found. GOOGLE_CREDENTIALS_B64 환경변수 또는 credentials.json 파일이 필요합니다.'
  );
}

export function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export function getFolderId(): string {
  const id = process.env.GDRIVE_FOLDER_ID;
  if (!id) throw new Error('GDRIVE_FOLDER_ID 환경변수를 설정하세요.');
  return id;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export interface DriveTrackPair {
  name: string;
  category: string;
  audioFile: DriveFile;
  textFile: DriveFile;
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/** 폴더 내 파일 목록 조회 */
async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const drive = getDrive();
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 100,
      pageToken,
      orderBy: 'modifiedTime desc',
    });

    for (const f of res.data.files || []) {
      files.push({
        id: f.id!,
        name: f.name!,
        mimeType: f.mimeType!,
        modifiedTime: f.modifiedTime!,
      });
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

/** mp3 파일의 ID3 태그에서 제목 추출 (첫 8KB만 다운로드) */
export async function readId3Title(fileId: string): Promise<string | null> {
  try {
    const { parseId3Title } = await import('./id3');
    const drive = getDrive();
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      {
        responseType: 'arraybuffer',
        headers: { Range: 'bytes=0-8191' },
      }
    );
    const buffer = Buffer.from(res.data as ArrayBuffer);
    return parseId3Title(buffer);
  } catch {
    return null;
  }
}

/** 파일 내용을 텍스트로 읽기 */
export async function readFileAsText(fileId: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  );
  return res.data as string;
}

/** 파일을 스트리밍으로 읽기 (오디오용) */
export async function readFileAsStream(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  size: number;
}> {
  const drive = getDrive();
  const meta = await drive.files.get({ fileId, fields: 'size' });
  const size = parseInt(meta.data.size || '0', 10);

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return { stream: res.data as unknown as NodeJS.ReadableStream, size };
}

/**
 * mp3 + txt/md 파일을 매칭
 * media_ 접두사 제거 후 매칭 (media_scenario_xxx.mp3 ↔ scenario_xxx.md)
 */
function normalizeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')     // 확장자 제거
    .replace(/^media_/, '');      // media_ 접두사 제거
}

function matchFilesInList(files: DriveFile[], category: string): DriveTrackPair[] {
  const audioMap = new Map<string, DriveFile>();
  const textMap = new Map<string, DriveFile>();

  for (const f of files) {
    const ext = f.name.replace(/^.*\./, '.').toLowerCase();
    const key = normalizeBaseName(f.name);

    if (ext === '.mp3' || ext === '.wav' || ext === '.m4a') {
      audioMap.set(key, f);
    } else if (ext === '.txt' || ext === '.md') {
      textMap.set(key, f);
    }
  }

  const pairs: DriveTrackPair[] = [];

  for (const [key, audioFile] of audioMap) {
    const textFile = textMap.get(key);
    if (textFile) {
      // 제목은 텍스트 파일명 기반 (media_ 없는 이름)
      const title = textFile.name.replace(/\.[^.]+$/, '');
      pairs.push({ name: title, category, audioFile, textFile });
    }
  }

  return pairs;
}

/**
 * Drive 폴더에서 모든 트랙 쌍을 조회
 *
 * 지원하는 구조:
 * 1) 루트폴더/시황/파일.mp3 + 파일.txt  (하위폴더 = 카테고리)
 * 2) 루트폴더/파일.mp3 + 파일.txt       (루트에 직접 = '시황' 기본값)
 */
export async function listAllTracks(): Promise<DriveTrackPair[]> {
  const rootId = getFolderId();
  const rootFiles = await listFilesInFolder(rootId);

  const allPairs: DriveTrackPair[] = [];

  // 하위 폴더 찾기
  const subFolders = rootFiles.filter((f) => f.mimeType === FOLDER_MIME);
  // 루트의 일반 파일
  const rootNonFolders = rootFiles.filter((f) => f.mimeType !== FOLDER_MIME);

  // 1) 하위폴더별 파일 조회 (폴더명 = 카테고리)
  const folderPromises = subFolders.map(async (folder) => {
    const files = await listFilesInFolder(folder.id);
    return matchFilesInList(files, folder.name);
  });

  const folderResults = await Promise.all(folderPromises);
  for (const pairs of folderResults) {
    allPairs.push(...pairs);
  }

  // 2) 루트에 직접 있는 파일 (기본 카테고리: 시황)
  const rootPairs = matchFilesInList(rootNonFolders, '시황');
  allPairs.push(...rootPairs);

  // 최신순 정렬
  allPairs.sort(
    (a, b) =>
      new Date(b.audioFile.modifiedTime).getTime() -
      new Date(a.audioFile.modifiedTime).getTime()
  );

  return allPairs;
}

export interface DriveVideo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

/**
 * Drive 'shorts' 폴더에서 동영상 파일 목록 조회
 * 지원 형식: mp4, mov, webm
 */
export async function listShorts(): Promise<DriveVideo[]> {
  const rootId = getFolderId();
  const rootFiles = await listFilesInFolder(rootId);

  // 'shorts' 폴더 찾기
  const shortsFolder = rootFiles.find(
    (f) => f.mimeType === FOLDER_MIME && f.name.toLowerCase() === 'shorts'
  );

  if (!shortsFolder) return [];

  const files = await listFilesInFolder(shortsFolder.id);

  const videoExts = ['.mp4', '.mov', '.webm', '.avi'];
  const videos = files.filter((f) => {
    const ext = f.name.replace(/^.*\./, '.').toLowerCase();
    return videoExts.includes(ext) || f.mimeType.startsWith('video/');
  });

  return videos.map((v) => ({
    id: v.id,
    name: v.name.replace(/\.[^.]+$/, ''),
    mimeType: v.mimeType,
    modifiedTime: v.modifiedTime,
  }));
}

/** shorts 폴더에 동영상 업로드 */
export async function uploadShort(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ id: string; name: string }> {
  const drive = getDrive();
  const rootId = getFolderId();
  const rootFiles = await listFilesInFolder(rootId);

  // shorts 폴더 찾기, 없으면 생성
  let shortsFolder = rootFiles.find(
    (f) => f.mimeType === FOLDER_MIME && f.name.toLowerCase() === 'shorts'
  );

  if (!shortsFolder) {
    const res = await drive.files.create({
      requestBody: {
        name: 'shorts',
        mimeType: FOLDER_MIME,
        parents: [rootId],
      },
      fields: 'id, name',
    });
    shortsFolder = { id: res.data.id!, name: 'shorts', mimeType: FOLDER_MIME, modifiedTime: '' };
  }

  // 파일 업로드
  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [shortsFolder.id],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name',
  });

  return { id: res.data.id!, name: res.data.name! };
}

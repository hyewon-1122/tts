import { google, drive_v3 } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

let driveClient: drive_v3.Drive | null = null;

function getCredentials(): Record<string, unknown> {
  // 1) 환경변수 (Vercel 등 서버리스)
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  // 2) 로컬 파일
  const credPath = path.join(process.cwd(), 'credentials.json');
  if (fs.existsSync(credPath)) {
    return JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  }
  throw new Error(
    'Google credentials not found. GOOGLE_CREDENTIALS 환경변수 또는 credentials.json 파일이 필요합니다.'
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

/** 폴더 내 파일 목록 조회 */
export async function listFiles(): Promise<DriveFile[]> {
  const drive = getDrive();
  const folderId = getFolderId();

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

/** 파일 내용을 텍스트로 읽기 */
export async function readFileAsText(fileId: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  );
  return res.data as string;
}

/** 파일을 Buffer로 읽기 (오디오 스트리밍용) */
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

/** mp3 + txt 파일을 매칭해서 반환 */
export function matchFiles(files: DriveFile[]): Array<{
  name: string;
  audioFile: DriveFile;
  textFile: DriveFile;
}> {
  const audioMap = new Map<string, DriveFile>();
  const textMap = new Map<string, DriveFile>();

  for (const f of files) {
    const ext = f.name.replace(/^.*\./, '.').toLowerCase();
    const baseName = f.name.replace(/\.[^.]+$/, '');

    if (ext === '.mp3' || ext === '.wav' || ext === '.m4a') {
      audioMap.set(baseName, f);
    } else if (ext === '.txt') {
      textMap.set(baseName, f);
    }
  }

  const pairs: Array<{ name: string; audioFile: DriveFile; textFile: DriveFile }> = [];

  for (const [name, audioFile] of audioMap) {
    const textFile = textMap.get(name);
    if (textFile) {
      pairs.push({ name, audioFile, textFile });
    }
  }

  pairs.sort(
    (a, b) =>
      new Date(b.audioFile.modifiedTime).getTime() -
      new Date(a.audioFile.modifiedTime).getTime()
  );

  return pairs;
}

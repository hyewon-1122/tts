import { NextResponse } from 'next/server';
import { listFiles, matchFiles } from '@/lib/gdrive';

// POST /api/sync - Drive 상태 확인 (DB 없이 바로 반환)
export async function POST() {
  try {
    const files = await listFiles();
    const pairs = matchFiles(files);
    return NextResponse.json({
      synced: pairs.length,
      total: pairs.length,
      newTracks: pairs.map((p) => ({ id: p.audioFile.id, title: p.name })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

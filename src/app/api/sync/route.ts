import { NextResponse } from 'next/server';
import { listExternalTracks } from '@/lib/external';

// POST /api/sync - 트랙 목록 새로고침
export async function POST() {
  try {
    const tracks = await listExternalTracks();
    return NextResponse.json({
      synced: tracks.length,
      total: tracks.length,
      newTracks: tracks.map((t) => ({ id: t.id, title: t.title, category: t.category })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

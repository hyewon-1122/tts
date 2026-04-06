import { NextResponse } from 'next/server';
import { listShorts } from '@/lib/gdrive';

// GET /api/shorts - Drive shorts 폴더에서 동영상 목록
export async function GET() {
  try {
    const videos = await listShorts();

    const shorts = videos.map((v) => ({
      id: v.id,
      title: v.name,
      videoUrl: `/api/audio/${v.id}`, // 같은 프록시 사용 (오디오/비디오 모두 지원)
      date: v.modifiedTime,
    }));

    return NextResponse.json(shorts, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

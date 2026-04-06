import { NextRequest, NextResponse } from 'next/server';
import { getDrive } from '@/lib/gdrive';

// GET /api/text?id=fileId — Drive에서 텍스트 파일 읽기
export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('id');
  if (!fileId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const drive = getDrive();
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return new NextResponse(res.data as string, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new NextResponse('', { status: 404 });
  }
}

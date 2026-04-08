import { NextRequest, NextResponse } from 'next/server';

// GET /api/text?url=... — 외부 서버에서 텍스트 파일 읽기
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse('', { status: 404 });
    const text = await res.text();
    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new NextResponse('', { status: 404 });
  }
}

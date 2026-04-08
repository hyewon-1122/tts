import { NextRequest, NextResponse } from 'next/server';

// Node.js runtime — Content-Length 유지됨 (Edge는 벗김)
export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/proxy?url=... - 외부 URL 프록시
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    const data = await res.arrayBuffer();

    return new NextResponse(Buffer.from(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(data.byteLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

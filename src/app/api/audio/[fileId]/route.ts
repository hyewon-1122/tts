import { NextRequest, NextResponse } from 'next/server';
import { readFileAsStream } from '@/lib/gdrive';

// GET /api/audio/[fileId] - Google Drive 오디오 프록시 스트리밍
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const { stream, size } = await readFileAsStream(fileId);

    const headers: Record<string, string> = {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    };

    if (size > 0) {
      headers['Content-Length'] = String(size);
    }

    // Node.js readable stream → Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        const nodeStream = stream as NodeJS.ReadableStream;
        nodeStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        nodeStream.on('end', () => {
          controller.close();
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(webStream, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { readFileAsStream, getDrive } from '@/lib/gdrive';

// GET /api/audio/[fileId] - Google Drive 미디어 프록시 스트리밍 (오디오 + 비디오)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    // 파일 메타데이터 조회 (mimeType 포함)
    const drive = getDrive();
    const meta = await drive.files.get({ fileId, fields: 'mimeType, size' });
    const mimeType = meta.data.mimeType || 'audio/mpeg';
    const size = parseInt(meta.data.size || '0', 10);

    const { stream } = await readFileAsStream(fileId);

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    };

    if (size > 0) {
      headers['Content-Length'] = String(size);
    }

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

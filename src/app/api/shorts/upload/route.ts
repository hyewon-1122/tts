import { NextRequest, NextResponse } from 'next/server';
import { uploadShort } from '@/lib/gdrive';

export const maxDuration = 60;

// POST /api/shorts/upload — 쇼츠 동영상 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });
    }

    // 동영상 파일만 허용
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: '동영상 파일만 업로드할 수 있습니다' }, { status: 400 });
    }

    // 100MB 제한
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: '100MB 이하의 파일만 업로드할 수 있습니다' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadShort(file.name, file.type, buffer);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

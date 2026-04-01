import { NextRequest, NextResponse } from 'next/server';
import { listFiles, matchFiles, readFileAsText } from '@/lib/gdrive';
import { parseTxtToLines, extractDateFromName, guessCategory } from '@/lib/parse-txt';
import { Track } from '@/lib/types';

// GET /api/tracks - Drive에서 직접 트랙 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    const files = await listFiles();
    const pairs = matchFiles(files);

    const tracks: Track[] = await Promise.all(
      pairs.map(async (pair) => {
        const rawText = await readFileAsText(pair.textFile.id);
        const lines = parseTxtToLines(rawText);
        const date = extractDateFromName(pair.name);
        const cat = guessCategory(pair.name);

        return {
          id: pair.audioFile.id,
          title: pair.name,
          category: cat,
          date,
          duration: 0,
          audioUrl: `/api/audio/${pair.audioFile.id}`,
          content: {
            title: pair.name,
            category: cat,
            date,
            duration: 0,
            text: rawText,
            lines,
          },
          createdAt: pair.audioFile.modifiedTime,
        };
      })
    );

    const filtered = category
      ? tracks.filter((t) => t.category === category)
      : tracks;

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

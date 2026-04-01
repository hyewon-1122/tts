import { TrackLine } from './types';

/**
 * 일반 텍스트 파일을 줄 단위로 파싱하여 TrackLine[] 생성
 * 타임스탬프가 없으므로 글자수 기반으로 시간을 자동 분배
 *
 * TTS 오디오 기준 대략 초당 4~5글자 읽는 속도로 추정
 */
export function parseTxtToLines(text: string, audioDuration?: number): TrackLine[] {
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  // 총 글자수 계산
  const totalChars = rawLines.reduce((sum, l) => sum + l.length, 0);

  // 오디오 길이가 주어지면 그에 맞춰 분배, 아니면 초당 5글자로 추정
  const totalTime = audioDuration || totalChars / 5;

  let currentTime = 0;
  const lines: TrackLine[] = [];

  for (const line of rawLines) {
    lines.push({
      time: Math.round(currentTime * 100) / 100,
      text: line,
    });
    // 이 줄의 비중만큼 시간 분배
    const ratio = line.length / totalChars;
    currentTime += ratio * totalTime;
  }

  return lines;
}

/** 파일명에서 날짜 추출 시도 (YYYY-MM-DD 또는 YYYYMMDD) */
export function extractDateFromName(name: string): string {
  // YYYY-MM-DD 패턴
  const match1 = name.match(/(\d{4}-\d{2}-\d{2})/);
  if (match1) return match1[1];

  // YYYYMMDD 패턴
  const match2 = name.match(/(\d{4})(\d{2})(\d{2})/);
  if (match2) return `${match2[1]}-${match2[2]}-${match2[3]}`;

  // 못 찾으면 오늘 날짜
  return new Date().toISOString().split('T')[0];
}

/** 파일명에서 카테고리 추측 */
export function guessCategory(name: string): string {
  if (/시황|마감|장중|장전/.test(name)) return '시황';
  if (/종목|실적|분석/.test(name)) return '종목';
  if (/테마|섹터|업종/.test(name)) return '테마';
  if (/이슈|뉴스|속보/.test(name)) return '이슈';
  return '시황';
}

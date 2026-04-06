import { TrackLine } from './types';

/**
 * 텍스트를 문장 단위로 분리하여 TrackLine[] 생성
 * 문장 구분: . ! ? 뒤에서 끊음 (줄바꿈도 구분자로 사용)
 * 타임스탬프는 글자수 비율로 자동 분배
 */
export function parseTxtToLines(text: string, audioDuration?: number): TrackLine[] {
  // 먼저 줄바꿈으로 분리한 뒤, 각 줄을 문장 단위로 다시 분리
  const sentences: string[] = [];
  const paragraphs = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (const para of paragraphs) {
    // 문장 종결 부호(. ! ?) 뒤에서 끊기
    const parts = para.split(/(?<=[.!?])\s+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) sentences.push(trimmed);
    }
  }

  const rawLines = sentences;

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

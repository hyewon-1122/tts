/**
 * API base URL
 * - 웹: 같은 서버 (빈 문자열)
 * - Capacitor 앱: 원격 서버 URL
 */
export function getApiBase(): string {
  // Capacitor 앱에서는 window.CAPACITOR_API_BASE 또는 환경 변수 사용
  if (typeof window !== 'undefined') {
    const w = window as unknown as { CAPACITOR_API_BASE?: string };
    if (w.CAPACITOR_API_BASE) return w.CAPACITOR_API_BASE;
  }
  return process.env.NEXT_PUBLIC_API_BASE || '';
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBase();
  return fetch(`${base}${path}`, init);
}

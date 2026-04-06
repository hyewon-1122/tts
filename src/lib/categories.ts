export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  icon: string; // 이미지 경로
}

export const categories: Category[] = [
  { id: 'today_market', label: '시황', emoji: '📊', color: '#8B5CF6', icon: '/market.png' },
  { id: 'stock', label: '종목', emoji: '🔍', color: '#EC4899', icon: '/stock.png' },
];

export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.id, c])
);

export function getCategoryLabel(id: string): string {
  return categoryMap[id]?.label || id;
}

export function getCategoryColor(id: string): string {
  return categoryMap[id]?.color || '#8B5CF6';
}

export function getCategoryEmoji(id: string): string {
  return categoryMap[id]?.emoji || '📊';
}

export function getCategoryIcon(id: string): string {
  return categoryMap[id]?.icon || '/market.png';
}

/** Formatação numérica pt-BR sem depender de Intl (compatível com qualquer engine JS). */
export function formatNumber(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = n < 0 ? '-' : '';
  return frac ? `${sign}${withDots},${frac}` : `${sign}${withDots}`;
}

export function formatPercent(n: number, decimals = 0): string {
  return `${formatNumber(n, decimals)}%`;
}

export function formatSignedPercent(n: number, decimals = 1): string {
  const s = formatNumber(n, decimals);
  return `${n > 0 ? '+' : ''}${s}%`;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "2026-11-19" → "19/11" */
export function formatShortDate(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${d}/${m}`;
}

export function formatWeekday(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeAgo(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} dia(s)`;
}

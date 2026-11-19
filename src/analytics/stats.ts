export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

export type Regression = { slope: number; intercept: number; r2: number; n: number };

/** Regressão linear simples (mínimos quadrados) com x = índice do dia. */
export function linearRegression(ys: number[]): Regression {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0, n };
  const xs = ys.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssRes += (ys[i] - pred) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2, n };
}

/** Projeta `days` valores futuros a partir da regressão. */
export function project(reg: Regression, days: number): number[] {
  return Array.from({ length: days }, (_, k) => reg.intercept + reg.slope * (reg.n + k));
}

export function movingAverage(xs: number[], window: number): number[] {
  return xs.map((_, i) => mean(xs.slice(Math.max(0, i - window + 1), i + 1)));
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

export function pctChange(current: number, reference: number): number {
  if (reference === 0) return 0;
  return ((current - reference) / reference) * 100;
}

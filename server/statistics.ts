import type {
  DatasetVariable,
  ProcessedTimePoint,
  RawObservationPoint,
  SeasonalBucketStat,
  SpatialAggregation,
  SpatialCellResult,
  StatisticalMethodPreference,
  TemporalAggregation,
  TrendStatistics,
} from '../src/types/earthpulse';

// ---------------------------------------------------------------------------
// Mathematical & Probability Helpers (Normal & Student-t Distributions)
// ---------------------------------------------------------------------------

/** Error function approximation (Abramowitz & Stegun 7.1.26, max error 1.5e-7) */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-ax * ax);
  return sign * y;
}

export function normalTwoTailedP(z: number): number {
  if (!Number.isFinite(z)) return 1;
  const cdf = 0.5 * (1 + erf(Math.abs(z) / Math.SQRT2));
  return Math.max(0, Math.min(1, 2 * (1 - cdf)));
}

/** Inverse standard normal CDF (Acklam's rational approximation) */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

/** Log-gamma via Lanczos approximation */
function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Regularized incomplete beta function I_x(a, b) via continued fraction */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 120;
  const EPS = 3e-7;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function betaIncomplete(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

export function studentTTwoTailedP(tStat: number, df: number): number {
  if (df <= 0 || !Number.isFinite(tStat)) return 1;
  const x = df / (df + tStat * tStat);
  return Math.max(0, Math.min(1, betaIncomplete(df / 2, 0.5, x)));
}

function studentTQuantile975(df: number): number {
  if (df <= 1) return 12.706;
  if (df === 2) return 4.303;
  // Cornish-Fisher expansion for 97.5th percentile of Student-t
  const z = 1.95996398454;
  const g1 = (z ** 3 + z) / (4 * df);
  const g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df * df);
  return z + g1 + g2;
}

// ---------------------------------------------------------------------------
// Date & Summary Helpers
// ---------------------------------------------------------------------------

export function toDecimalYear(isoDate: string): number {
  const [yStr, mStr = '6', dStr = '15'] = isoDate.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  const cur = Date.UTC(y, Math.max(0, m - 1), Math.max(1, d));
  return y + (cur - start) / (end - start);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

export function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sumSq = values.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

function getSeason(isoDate: string): 'DJF' | 'MAM' | 'JJA' | 'SON' {
  const month = Number(isoDate.split('-')[1] || '1');
  if (month === 12 || month <= 2) return 'DJF';
  if (month >= 3 && month <= 5) return 'MAM';
  if (month >= 6 && month <= 8) return 'JJA';
  return 'SON';
}

const SEASON_LABELS: Record<'DJF' | 'MAM' | 'JJA' | 'SON', string> = {
  DJF: 'Dec–Feb (DJF)',
  MAM: 'Mar–May (MAM)',
  JJA: 'Jun–Aug (JJA)',
  SON: 'Sep–Nov (SON)',
};

// ---------------------------------------------------------------------------
// Core Statistical Estimators (OLS, Sen's Slope, MK, Modified MK, Seasonal MK)
// ---------------------------------------------------------------------------

export function computeOls(times: number[], values: number[]) {
  const n = times.length;
  if (n < 3) {
    return {
      slope: 0,
      intercept: values[0] ?? 0,
      r2: 0,
      standardError: 0,
      ci95Lower: 0,
      ci95Upper: 0,
      pValue: 1,
    };
  }
  const tMean = mean(times);
  const yMean = mean(values);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dt = times[i] - tMean;
    const dy = values[i] - yMean;
    sxx += dt * dt;
    sxy += dt * dy;
    syy += dy * dy;
  }
  if (sxx === 0) {
    return {
      slope: 0,
      intercept: yMean,
      r2: 0,
      standardError: 0,
      ci95Lower: 0,
      ci95Upper: 0,
      pValue: 1,
    };
  }
  const slope = sxy / sxx;
  const intercept = yMean - slope * tMean;

  let sse = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * times[i];
    sse += (values[i] - pred) ** 2;
  }
  const df = n - 2;
  const residualVar = sse / df;
  const seSlope = Math.sqrt(residualVar / sxx);
  const tCrit = studentTQuantile975(df);
  const tStat = seSlope > 0 ? slope / seSlope : 0;
  const pValue = seSlope > 0 ? studentTTwoTailedP(tStat, df) : 1;
  const r2 = syy > 0 ? Math.max(0, Math.min(1, 1 - sse / syy)) : 0;

  return {
    slope,
    intercept,
    r2,
    standardError: seSlope,
    ci95Lower: slope - tCrit * seSlope,
    ci95Upper: slope + tCrit * seSlope,
    pValue,
  };
}

export function computeSensSlope(times: number[], values: number[]) {
  const n = times.length;
  if (n < 3) {
    return { slope: 0, ci95Lower: 0, ci95Upper: 0 };
  }
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dt = times[j] - times[i];
      if (dt > 1e-6) {
        slopes.push((values[j] - values[i]) / dt);
      }
    }
  }
  if (slopes.length === 0) {
    return { slope: 0, ci95Lower: 0, ci95Upper: 0 };
  }
  slopes.sort((a, b) => a - b);
  const m = slopes.length;
  const mid = Math.floor(m / 2);
  const medSlope = m % 2 === 0 ? (slopes[mid - 1] + slopes[mid]) / 2 : slopes[mid];

  // Gilbert (1987) non-parametric 95% confidence interval for Sen's slope
  const varS = (n * (n - 1) * (2 * n + 5)) / 18;
  const cAlpha = 1.95996398454 * Math.sqrt(varS);
  const m1 = Math.max(0, Math.floor((m - cAlpha) / 2));
  const m2 = Math.min(m - 1, Math.ceil((m + cAlpha) / 2));

  return {
    slope: medSlope,
    ci95Lower: slopes[m1],
    ci95Upper: slopes[m2],
  };
}

function computeTieCorrection(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) {
    const key = Math.round(v * 1e6) / 1e6;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let tieSum = 0;
  for (const t of counts.values()) {
    if (t > 1) {
      tieSum += t * (t - 1) * (2 * t + 5);
    }
  }
  return tieSum;
}

export function computeLag1Autocorrelation(series: number[]): number {
  const n = series.length;
  if (n < 6) return 0;
  const m = mean(series);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    den += (series[i] - m) ** 2;
    if (i > 0) {
      num += (series[i] - m) * (series[i - 1] - m);
    }
  }
  if (den <= 1e-12) return 0;
  return Math.max(-0.95, Math.min(0.95, num / den));
}

export function computeMannKendall(times: number[], values: number[]) {
  const n = values.length;
  if (n < 4) {
    return {
      s: 0,
      tau: 0,
      z: 0,
      pValue: 1,
      lag1Rho: 0,
      ess: n,
      modifiedZ: 0,
      modifiedPValue: 1,
    };
  }

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = values[j] - values[i];
      if (diff > 1e-9) s += 1;
      else if (diff < -1e-9) s -= 1;
    }
  }

  const tieSum = computeTieCorrection(values);
  const varS = Math.max(1e-9, (n * (n - 1) * (2 * n + 5) - tieSum) / 18);
  const z = s > 0 ? (s - 1) / Math.sqrt(varS) : s < 0 ? (s + 1) / Math.sqrt(varS) : 0;
  const pValue = normalTwoTailedP(z);
  const tau = s / ((n * (n - 1)) / 2);

  // Detrend with Sen's slope before estimating lag-1 autocorrelation (Yue & Wang 2004 / Hamed & Rao 1998)
  const sens = computeSensSlope(times, values);
  const t0 = times[0];
  const residuals = values.map((v, idx) => v - sens.slope * (times[idx] - t0));
  const rho1 = computeLag1Autocorrelation(residuals);

  // Effective Sample Size correction when lag-1 autocorrelation is statistically notable
  // Hamed & Rao (1998) / Yue & Wang (2004) variance inflation factor: (1 + rho1) / (1 - rho1)
  const critRho = 1.96 / Math.sqrt(n);
  let vif = 1;
  if (Math.abs(rho1) > critRho && rho1 > 0) {
    vif = Math.min(n / 4, (1 + rho1) / (1 - rho1));
  }
  const ess = Math.max(4, n / vif);
  const modVarS = varS * vif;
  const modifiedZ =
    s > 0 ? (s - 1) / Math.sqrt(modVarS) : s < 0 ? (s + 1) / Math.sqrt(modVarS) : 0;
  const modifiedPValue = normalTwoTailedP(modifiedZ);

  return {
    s,
    tau,
    z,
    pValue,
    lag1Rho: rho1,
    ess,
    modifiedZ,
    modifiedPValue,
  };
}

export function computeSeasonalMannKendall(dates: string[], values: number[]) {
  const buckets = new Map<string, number[]>();
  for (let i = 0; i < dates.length; i++) {
    const month = dates[i].split('-')[1] || '01';
    const arr = buckets.get(month) ?? [];
    arr.push(values[i]);
    buckets.set(month, arr);
  }

  let totalS = 0;
  let totalVar = 0;
  let totalPairs = 0;

  for (const arr of buckets.values()) {
    const m = arr.length;
    if (m < 2) continue;
    let sg = 0;
    for (let i = 0; i < m - 1; i++) {
      for (let j = i + 1; j < m; j++) {
        const diff = arr[j] - arr[i];
        if (diff > 1e-9) sg += 1;
        else if (diff < -1e-9) sg -= 1;
      }
    }
    const tieSum = computeTieCorrection(arr);
    const varG = (m * (m - 1) * (2 * m + 5) - tieSum) / 18;
    totalS += sg;
    totalVar += Math.max(0, varG);
    totalPairs += (m * (m - 1)) / 2;
  }

  if (totalVar <= 1e-9 || totalPairs === 0) {
    return { s: 0, z: 0, pValue: 1, tau: 0 };
  }

  const z =
    totalS > 0
      ? (totalS - 1) / Math.sqrt(totalVar)
      : totalS < 0
      ? (totalS + 1) / Math.sqrt(totalVar)
      : 0;

  return {
    s: totalS,
    z,
    pValue: normalTwoTailedP(z),
    tau: totalS / totalPairs,
  };
}

// ---------------------------------------------------------------------------
// Temporal & Spatial Processing Pipeline
// ---------------------------------------------------------------------------

export interface CellSeriesInput {
  cellId: string;
  row: number;
  col: number;
  lat: number;
  lon: number;
  bounds: [[number, number], [number, number]];
  observations: RawObservationPoint[];
}

function bucketDate(isoDate: string, agg: TemporalAggregation): string {
  const [y, m = '01'] = isoDate.split('-');
  if (agg === 'native') return isoDate;
  if (agg === 'monthly') return `${y}-${m}-15`;
  if (agg === 'annual') return `${y}-07-01`;
  // seasonal
  const mo = Number(m);
  if (mo === 12) return `${Number(y) + 1}-01-15`;
  if (mo <= 2) return `${y}-01-15`;
  if (mo <= 5) return `${y}-04-15`;
  if (mo <= 8) return `${y}-07-15`;
  return `${y}-10-15`;
}

export function aggregateCellObservations(
  observations: RawObservationPoint[],
  temporalAgg: TemporalAggregation
): Array<{ date: string; value: number }> {
  const valid = observations.filter((o) => o.qcPassed && o.rawValue !== null && Number.isFinite(o.rawValue));
  if (temporalAgg === 'native') {
    return valid
      .map((o) => ({ date: o.date, value: o.rawValue as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const grouped = new Map<string, number[]>();
  for (const obs of valid) {
    const key = bucketDate(obs.date, temporalAgg);
    const list = grouped.get(key) ?? [];
    list.push(obs.rawValue as number);
    grouped.set(key, list);
  }
  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({ date, value: mean(vals) }));
}

export function processInvestigationStatistics(params: {
  variable: DatasetVariable;
  cells: CellSeriesInput[];
  spatialAggregation: SpatialAggregation;
  temporalAggregation: TemporalAggregation;
  statisticalMethod: StatisticalMethodPreference;
  alpha: number;
  deseasonalize: boolean;
}): {
  timeSeries: ProcessedTimePoint[];
  seasonalBreakdown: SeasonalBucketStat[];
  statistics: TrendStatistics;
  spatialCells: SpatialCellResult[];
} {
  const {
    variable,
    cells,
    spatialAggregation,
    temporalAggregation,
    statisticalMethod,
    alpha,
    deseasonalize,
  } = params;

  // 1. Track Raw vs QC Counts across all cells
  let nTotalRaw = 0;
  let nQcRejected = 0;
  let nMissingOrFill = 0;

  for (const cell of cells) {
    for (const obs of cell.observations) {
      nTotalRaw += 1;
      if (obs.rawValue === null || !Number.isFinite(obs.rawValue)) {
        nMissingOrFill += 1;
      } else if (!obs.qcPassed) {
        nQcRejected += 1;
      }
    }
  }

  // 2. Aggregate each cell temporally and merge onto common timestamps
  const dateCellValues = new Map<string, number[]>();
  const totalCells = cells.length;

  for (const cell of cells) {
    const aggSeries = aggregateCellObservations(cell.observations, temporalAggregation);
    for (const pt of aggSeries) {
      const list = dateCellValues.get(pt.date) ?? [];
      list.push(pt.value);
      dateCellValues.set(pt.date, list);
    }
  }

  const sortedDates = Array.from(dateCellValues.keys()).sort();
  const regionalDates: string[] = [];
  const regionalValues: number[] = [];
  const regionalCoverage: number[] = [];
  const regionalValidCellCounts: number[] = [];

  for (const d of sortedDates) {
    const vals = dateCellValues.get(d)!;
    if (vals.length === 0) continue;
    const aggVal = spatialAggregation === 'regional_median' ? median(vals) : mean(vals);
    regionalDates.push(d);
    regionalValues.push(aggVal);
    regionalValidCellCounts.push(vals.length);
    regionalCoverage.push((vals.length / Math.max(1, totalCells)) * 100);
  }

  const decimalYears = regionalDates.map(toDecimalYear);

  // 3. Seasonal Decomposition (Additive Monthly/Seasonal Climatology)
  const canDeseasonalize =
    deseasonalize && temporalAggregation !== 'annual' && regionalDates.length >= 12;
  const globalMean = mean(regionalValues);

  const monthBuckets = new Map<string, number[]>();
  for (let i = 0; i < regionalDates.length; i++) {
    const key =
      temporalAggregation === 'seasonal'
        ? getSeason(regionalDates[i])
        : regionalDates[i].split('-')[1] || '01';
    const arr = monthBuckets.get(key) ?? [];
    arr.push(regionalValues[i]);
    monthBuckets.set(key, arr);
  }

  const seasonalOffsets = new Map<string, number>();
  for (const [k, vals] of monthBuckets.entries()) {
    seasonalOffsets.set(k, mean(vals) - globalMean);
  }

  const deseasonalizedValues = regionalValues.map((v, i) => {
    if (!canDeseasonalize) return v;
    const key =
      temporalAggregation === 'seasonal'
        ? getSeason(regionalDates[i])
        : regionalDates[i].split('-')[1] || '01';
    return v - (seasonalOffsets.get(key) ?? 0);
  });

  // 4. Outlier Assessment using Modified Z-score (Iglewicz & Hoaglin 1993) on deseasonalized values
  const medDeseas = median(deseasonalizedValues);
  const absDevs = deseasonalizedValues.map((v) => Math.abs(v - medDeseas));
  const mad = median(absDevs);
  const modifiedZScores = deseasonalizedValues.map((v) =>
    mad > 1e-9 ? (0.6745 * (v - medDeseas)) / mad : 0
  );
  const isOutlierFlags = modifiedZScores.map((z) => Math.abs(z) > 3.5);
  const nOutliersFlagged = isOutlierFlags.filter(Boolean).length;

  // 5. Statistical Trend Testing on primary analysis series (deseasonalized if enabled)
  const analysisValues = canDeseasonalize ? deseasonalizedValues : regionalValues;
  const ols = computeOls(decimalYears, analysisValues);
  const sens = computeSensSlope(decimalYears, analysisValues);
  const mk = computeMannKendall(decimalYears, analysisValues);
  const smk = computeSeasonalMannKendall(regionalDates, regionalValues);

  // Determine active statistical method based on user preference or variable suitability
  const resolvedPref =
    statisticalMethod === 'auto' ? variable.recommendedMethod : statisticalMethod;

  let methodSelected = 'Hamed-Rao Modified Mann-Kendall + Sen\'s Slope';
  let activePValue = mk.modifiedPValue;

  if (resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual') {
    methodSelected = 'Seasonal Mann-Kendall + Theil-Sen Slope';
    activePValue = smk.pValue;
  } else if (resolvedPref === 'mann_kendall_sens') {
    methodSelected = 'Mann-Kendall Test + Theil-Sen Slope';
    activePValue = mk.pValue;
  } else if (resolvedPref === 'ols_parametric') {
    methodSelected = 'Ordinary Least Squares (OLS) Parametric Regression';
    activePValue = ols.pValue;
  } else {
    methodSelected = 'Hamed-Rao Modified Mann-Kendall + Sen\'s Slope';
    activePValue = mk.modifiedPValue;
  }

  const isStatisticallySignificant =
    regionalValues.length >= 4 && activePValue < alpha;

  const primarySlopePerYear =
    resolvedPref === 'ols_parametric' ? ols.slope : sens.slope;

  const trendDirection: TrendStatistics['trendDirection'] = !isStatisticallySignificant
    ? 'no_significant_trend'
    : primarySlopePerYear > 0
    ? 'increasing'
    : primarySlopePerYear < 0
    ? 'decreasing'
    : 'no_significant_trend';

  const spanYears =
    decimalYears.length >= 2
      ? Math.max(0.01, decimalYears[decimalYears.length - 1] - decimalYears[0])
      : 0;
  const totalEstimatedChange = primarySlopePerYear * spanYears;

  const t0 = decimalYears[0] ?? 0;
  const trendIntercept = median(
    analysisValues.map((v, i) => v - sens.slope * (decimalYears[i] - t0))
  );

  const timeSeries: ProcessedTimePoint[] = regionalDates.map((d, i) => {
    const key =
      temporalAggregation === 'seasonal'
        ? getSeason(d)
        : d.split('-')[1] || '01';
    const sComp = canDeseasonalize ? (seasonalOffsets.get(key) ?? 0) : 0;
    const tComp = trendIntercept + sens.slope * (decimalYears[i] - t0);
    const resid = analysisValues[i] - tComp;
    return {
      date: d,
      decimalYear: decimalYears[i],
      value: regionalValues[i],
      deseasonalizedValue: deseasonalizedValues[i],
      seasonalComponent: sComp,
      trendComponent: tComp,
      residualComponent: resid,
      isOutlier: isOutlierFlags[i],
      zScoreModified: modifiedZScores[i],
      validCellCount: regionalValidCellCounts[i],
      totalCellCount: totalCells,
      coveragePct: regionalCoverage[i],
    };
  });

  // 6. Seasonal Breakdown (DJF, MAM, JJA, SON)
  const seasonsOrder: Array<'DJF' | 'MAM' | 'JJA' | 'SON'> = ['DJF', 'MAM', 'JJA', 'SON'];
  const seasonalBreakdown: SeasonalBucketStat[] = seasonsOrder.map((season) => {
    const idxs: number[] = [];
    for (let i = 0; i < regionalDates.length; i++) {
      if (getSeason(regionalDates[i]) === season) idxs.push(i);
    }
    const sTimes = idxs.map((idx) => decimalYears[idx]);
    const sVals = idxs.map((idx) => regionalValues[idx]);
    const sSens = computeSensSlope(sTimes, sVals);
    const sMk = computeMannKendall(sTimes, sVals);
    return {
      season,
      label: SEASON_LABELS[season],
      mean: mean(sVals),
      stdDev: sampleStdDev(sVals),
      sensSlopePerDecade: sSens.slope * 10,
      mkPValue: sMk.pValue,
      n: sVals.length,
    };
  });

  // 7. Detrended standard deviation & Practical vs Statistical Significance
  const detrendedResiduals = analysisValues.map(
    (v, i) => v - (trendIntercept + sens.slope * (decimalYears[i] - t0))
  );
  const detrendedStdDev = sampleStdDev(detrendedResiduals);
  const absDecadeRate = Math.abs(primarySlopePerYear * 10);
  const isPracticallyImportant =
    isStatisticallySignificant &&
    absDecadeRate >= variable.practicalSignificanceThresholdPerDecade;

  const practicalImportanceNote = !isStatisticallySignificant
    ? `No statistically significant monotonic trend was detected at α = ${alpha} (p = ${activePValue.toFixed(
        4
      )}). Observed fluctuations remain indistinguishable from background interannual variability (σ_detrended = ${detrendedStdDev.toFixed(
        3
      )} ${variable.unit}).`
    : isPracticallyImportant
    ? `Both statistically significant (p = ${activePValue.toFixed(
        4
      )}) and practically meaningful: the estimated rate (${(primarySlopePerYear * 10).toFixed(
        3
      )} ${variable.unit}/decade) exceeds the domain threshold of ${
        variable.practicalSignificanceThresholdPerDecade
      } ${variable.unit}/decade.`
    : `Statistically significant (p = ${activePValue.toFixed(
        4
      )}) due to sample size or low variance, but the physical magnitude (${(
        primarySlopePerYear * 10
      ).toFixed(3)} ${variable.unit}/decade) is modest relative to the domain relevance threshold (${
        variable.practicalSignificanceThresholdPerDecade
      } ${variable.unit}/decade) and natural variability (σ = ${detrendedStdDev.toFixed(3)} ${
        variable.unit
      }).`;

  const nValidObservations = nTotalRaw - nQcRejected - nMissingOrFill;
  const coveragePercentage = nTotalRaw > 0 ? (nValidObservations / nTotalRaw) * 100 : 0;

  const statistics: TrendStatistics = {
    methodSelected,
    methodRationale: variable.methodRationale,
    nTotalRaw,
    nValidObservations,
    nQcRejected,
    nMissingOrFill,
    nOutliersFlagged,
    coveragePercentage,
    meanValue: mean(regionalValues),
    medianValue: median(regionalValues),
    stdDev: sampleStdDev(regionalValues),
    detrendedStdDev,
    minValue: regionalValues.length ? Math.min(...regionalValues) : 0,
    maxValue: regionalValues.length ? Math.max(...regionalValues) : 0,
    olsSlopePerYear: ols.slope,
    olsSlopePerDecade: ols.slope * 10,
    olsIntercept: ols.intercept,
    olsR2: ols.r2,
    olsStandardErrorPerYear: ols.standardError,
    olsCi95LowerPerDecade: ols.ci95Lower * 10,
    olsCi95UpperPerDecade: ols.ci95Upper * 10,
    olsPValue: ols.pValue,
    sensSlopePerYear: sens.slope,
    sensSlopePerDecade: sens.slope * 10,
    sensCi95LowerPerDecade: sens.ci95Lower * 10,
    sensCi95UpperPerDecade: sens.ci95Upper * 10,
    totalEstimatedChange,
    mkS: resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual' ? smk.s : mk.s,
    mkTau: resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual' ? smk.tau : mk.tau,
    mkZ: resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual' ? smk.z : mk.z,
    mkPValue: resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual' ? smk.pValue : mk.pValue,
    lag1Autocorrelation: mk.lag1Rho,
    effectiveSampleSize: mk.ess,
    modifiedMkZ: mk.modifiedZ,
    modifiedMkPValue: mk.modifiedPValue,
    activePValue,
    alpha,
    isStatisticallySignificant,
    trendDirection,
    isPracticallyImportant,
    practicalImportanceNote,
  };

  // 8. Spatial Cell-Level Trends + Benjamini-Hochberg FDR Multiple-Testing Correction
  const rawCellStats = cells.map((cell) => {
    const aggSeries = aggregateCellObservations(cell.observations, temporalAggregation);
    const cTimes = aggSeries.map((pt) => toDecimalYear(pt.date));
    const cVals = aggSeries.map((pt) => pt.value);

    // Deseasonalize cell if requested
    const cMonthMap = new Map<string, number[]>();
    const cMean = mean(cVals);
    if (canDeseasonalize && aggSeries.length >= 12) {
      for (let i = 0; i < aggSeries.length; i++) {
        const key =
          temporalAggregation === 'seasonal'
            ? getSeason(aggSeries[i].date)
            : aggSeries[i].date.split('-')[1] || '01';
        const arr = cMonthMap.get(key) ?? [];
        arr.push(cVals[i]);
        cMonthMap.set(key, arr);
      }
    }
    const cDeseas = cVals.map((v, i) => {
      if (!canDeseasonalize || aggSeries.length < 12) return v;
      const key =
        temporalAggregation === 'seasonal'
          ? getSeason(aggSeries[i].date)
          : aggSeries[i].date.split('-')[1] || '01';
      const bucketVals = cMonthMap.get(key);
      return bucketVals ? v - (mean(bucketVals) - cMean) : v;
    });

    const cOls = computeOls(cTimes, cDeseas);
    const cSens = computeSensSlope(cTimes, cDeseas);
    const cMk = computeMannKendall(cTimes, cDeseas);
    const cSmk = computeSeasonalMannKendall(
      aggSeries.map((pt) => pt.date),
      cVals
    );

    const pVal =
      resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual'
        ? cSmk.pValue
        : resolvedPref === 'ols_parametric'
        ? cOls.pValue
        : resolvedPref === 'mann_kendall_sens'
        ? cMk.pValue
        : cMk.modifiedPValue;

    const zVal =
      resolvedPref === 'seasonal_mk' && temporalAggregation !== 'annual'
        ? cSmk.z
        : cMk.modifiedZ;

    const validObsCount = cell.observations.filter((o) => o.qcPassed && o.rawValue !== null).length;
    const covPct =
      cell.observations.length > 0 ? (validObsCount / cell.observations.length) * 100 : 0;

    return {
      cell,
      cMean,
      cSensPerDecade: cSens.slope * 10,
      cOlsPerDecade: cOls.slope * 10,
      zVal,
      pVal: cVals.length >= 4 ? pVal : 1,
      validObsCount,
      covPct,
    };
  });

  // Benjamini-Hochberg FDR adjustment across m spatial cells
  const mCells = rawCellStats.length;
  const indexed = rawCellStats.map((item, idx) => ({ idx, p: item.pVal }));
  indexed.sort((a, b) => a.p - b.p);
  const qValues = new Array<number>(mCells).fill(1);
  let minSoFar = 1;
  for (let rank = mCells; rank >= 1; rank--) {
    const item = indexed[rank - 1];
    const adj = Math.min(1, (item.p * mCells) / rank);
    minSoFar = Math.min(minSoFar, adj);
    qValues[item.idx] = minSoFar;
  }

  const spatialCells: SpatialCellResult[] = rawCellStats.map((item, idx) => {
    const fdrQ = qValues[idx];
    const isSigRaw = item.pVal < alpha;
    const isSigFdr = fdrQ < alpha;
    const slope = resolvedPref === 'ols_parametric' ? item.cOlsPerDecade : item.cSensPerDecade;
    const direction: SpatialCellResult['direction'] = !isSigRaw
      ? 'no_significant_trend'
      : slope > 0
      ? 'increasing'
      : slope < 0
      ? 'decreasing'
      : 'no_significant_trend';

    return {
      cellId: item.cell.cellId,
      row: item.cell.row,
      col: item.cell.col,
      lat: item.cell.lat,
      lon: item.cell.lon,
      bounds: item.cell.bounds,
      meanValue: item.cMean,
      sensSlopePerDecade: item.cSensPerDecade,
      olsSlopePerDecade: item.cOlsPerDecade,
      mkZ: item.zVal,
      pValue: item.pVal,
      fdrQValue: fdrQ,
      isSignificantRaw: isSigRaw,
      isSignificantFdr: isSigFdr,
      direction,
      validObservations: item.validObsCount,
      coveragePct: item.covPct,
    };
  });

  return {
    timeSeries,
    seasonalBreakdown,
    statistics,
    spatialCells,
  };
}

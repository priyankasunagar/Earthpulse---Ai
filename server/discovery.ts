import type {
  DatasetVariable,
  DiscoverySummary,
  InvestigationRequest,
  ProcessedTimePoint,
  SpatialCellResult,
  TrendStatistics,
} from '../src/types/earthpulse';

function fmtSign(n: number, decimals = 3): string {
  const s = n.toFixed(decimals);
  return n > 0 ? `+${s}` : s;
}

export function generateDiscoverySummary(params: {
  dataMode: 'live_verified' | 'demonstration_fallback';
  variable: DatasetVariable;
  request: InvestigationRequest;
  statistics: TrendStatistics;
  spatialCells: SpatialCellResult[];
  timeSeries: ProcessedTimePoint[];
  comparison?: {
    regionName: string;
    statistics: TrendStatistics;
  } | null;
}): DiscoverySummary {
  const { dataMode, variable, request, statistics, spatialCells, timeSeries, comparison } = params;

  const dirPhrase =
    statistics.trendDirection === 'increasing'
      ? 'statistically significant increasing trend'
      : statistics.trendDirection === 'decreasing'
      ? 'statistically significant decreasing trend'
      : 'no statistically significant monotonic trend';

  const modePrefix =
    dataMode === 'demonstration_fallback'
      ? '[Demonstration Mode — Not Live Satellite Observations] '
      : '';

  const headline = `${modePrefix}${variable.variableName} (${variable.datasetId}) exhibits ${dirPhrase} in ${request.regionName} (${request.startDate} to ${request.endDate}).`;

  const whatIsChanging = `${variable.variableName} (${variable.unit}) from ${variable.missionOrModel} (${variable.datasetId}) was analysed over the ${request.startDate} to ${request.endDate} observation window. ${variable.physicalMeaningNote}`;

  // Spatial heterogeneity summary
  const sigFdrCount = spatialCells.filter((c) => c.isSignificantFdr).length;
  const sigRawCount = spatialCells.filter((c) => c.isSignificantRaw).length;
  const incCount = spatialCells.filter((c) => c.direction === 'increasing').length;
  const decCount = spatialCells.filter((c) => c.direction === 'decreasing').length;
  const slopes = spatialCells.map((c) => c.sensSlopePerDecade);
  const minCellSlope = slopes.length ? Math.min(...slopes) : 0;
  const maxCellSlope = slopes.length ? Math.max(...slopes) : 0;

  const whereIsItChanging = `Across the ${spatialCells.length} spatial grid cells centered at (${request.lat.toFixed(
    3
  )}°, ${request.lon.toFixed(3)}°) within a ~${request.radiusKm} km radius, ${incCount} cell(s) show increasing trends, ${decCount} show decreasing trends, and ${
    spatialCells.length - incCount - decCount
  } show no significant change at α = ${statistics.alpha}. After Benjamini-Hochberg false discovery rate (FDR) correction across all ${
    spatialCells.length
  } cells, ${sigFdrCount} cell(s) remain statistically significant (${sigRawCount} before FDR adjustment). Spatial trend magnitudes span from ${fmtSign(
    minCellSlope
  )} to ${fmtSign(maxCellSlope)} ${variable.unit}/decade.`;

  const howMuchIsItChanging = `The non-parametric Theil-Sen slope estimator yields ${fmtSign(
    statistics.sensSlopePerDecade
  )} ${variable.unit}/decade (95% CI: [${fmtSign(
    statistics.sensCi95LowerPerDecade
  )}, ${fmtSign(statistics.sensCi95UpperPerDecade)}] ${
    variable.unit
  }/decade), corresponding to an estimated cumulative shift of ${fmtSign(
    statistics.totalEstimatedChange
  )} ${variable.unit} over the analysed period. Ordinary Least Squares (OLS) regression estimates ${fmtSign(
    statistics.olsSlopePerDecade
  )} ${variable.unit}/decade (R² = ${statistics.olsR2.toFixed(3)}, p = ${statistics.olsPValue.toFixed(
    4
  )}).`;

  const isItSignificant = statistics.isStatisticallySignificant
    ? `Yes — statistically significant under ${statistics.methodSelected} (p = ${statistics.activePValue.toFixed(
        4
      )} < α = ${statistics.alpha}; Kendall τ = ${statistics.mkTau.toFixed(
        3
      )}, Z = ${statistics.modifiedMkZ.toFixed(2)}). ${statistics.practicalImportanceNote}`
    : `No — not statistically significant under ${statistics.methodSelected} (p = ${statistics.activePValue.toFixed(
        4
      )} ≥ α = ${statistics.alpha}; Kendall τ = ${statistics.mkTau.toFixed(
        3
      )}, Z = ${statistics.modifiedMkZ.toFixed(2)}). ${statistics.practicalImportanceNote}`;

  const dataSupportAndCoverage = `${statistics.nValidObservations.toLocaleString()} valid observations passed quality control out of ${statistics.nTotalRaw.toLocaleString()} raw grid-cell records (${statistics.coveragePercentage.toFixed(
    1
  )}% valid coverage; ${statistics.nQcRejected} rejected by quality/range checks; ${statistics.nMissingOrFill} missing or fill-masked; ${
    statistics.nOutliersFlagged
  } statistical outliers flagged via modified Z-score > 3.5). Aggregated series contains ${
    timeSeries.length
  } temporal steps (${request.temporalAggregation} cadence).`;

  let comparisonContrast: string | null = null;
  if (comparison) {
    const deltaSlope = statistics.sensSlopePerDecade - comparison.statistics.sensSlopePerDecade;
    comparisonContrast = `Compared against ${comparison.regionName} (Sen's slope ${fmtSign(
      comparison.statistics.sensSlopePerDecade
    )} ${variable.unit}/decade, p = ${comparison.statistics.activePValue.toFixed(
      4
    )}, ${
      comparison.statistics.trendDirection === 'no_significant_trend'
        ? 'no significant trend'
        : comparison.statistics.trendDirection
    }), ${request.regionName} differs by ${fmtSign(deltaSlope)} ${
      variable.unit
    }/decade. Any regional divergence reflects empirical statistical contrast only; attributing physical causation requires dedicated radiative transfer, land-cover, or circulation experiments.`;
  }

  const uncertaintyAndLimitations: string[] = [
    `Temporal autocorrelation: detrended lag-1 autocorrelation ρ₁ = ${statistics.lag1Autocorrelation.toFixed(
      3
    )}, reducing effective sample size from n = ${timeSeries.length} to n* = ${statistics.effectiveSampleSize.toFixed(
      1
    )}.`,
    `Spatial scale & sub-grid heterogeneity: ${variable.spatialResolution} pixels smooth micro-scale land-surface variability within each grid cell.`,
    `Observational correlation vs. causation: trend tests quantify monotonic rate and statistical evidence only and do not establish causal drivers.`,
    `Dataset-specific quality constraint: ${variable.qualityInfo}`,
  ];

  if (dataMode === 'demonstration_fallback') {
    uncertaintyAndLimitations.unshift(
      'DEMONSTRATION MODE WARNING: Live upstream retrieval failed; results reflect synthetic placeholder time series and must not be cited as NASA measurements.'
    );
  }

  return {
    headline,
    whatIsChanging,
    whereIsItChanging,
    howMuchIsItChanging,
    isItSignificant,
    dataSupportAndCoverage,
    comparisonContrast,
    uncertaintyAndLimitations,
  };
}

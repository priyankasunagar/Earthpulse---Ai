export type VariableCategory =
  | 'Temperature'
  | 'Vegetation'
  | 'Water'
  | 'Atmosphere'
  | 'Land & Environment';

export type DataProvider =
  | 'NASA_ORNL_MODIS'
  | 'NASA_POWER'
  | 'OPEN_METEO_ERA5';

export type TemporalAggregation = 'native' | 'monthly' | 'seasonal' | 'annual';
export type SpatialAggregation = 'grid_cells' | 'regional_mean' | 'regional_median';
export type StatisticalMethodPreference =
  | 'auto'
  | 'mann_kendall_sens'
  | 'modified_mk_hamed_rao'
  | 'seasonal_mk'
  | 'ols_parametric';

export interface DatasetVariable {
  id: string;
  variableName: string;
  shortLabel: string;
  category: VariableCategory;
  scientificDescription: string;
  physicalMeaningNote: string;
  unit: string;
  datasetId: string;
  datasetName: string;
  missionOrModel: string;
  dataSource: string;
  provider: DataProvider;
  providerBand: string;
  cmrShortName: string;
  doi: string;
  documentationUrl: string;
  spatialResolution: string;
  temporalResolution: string;
  observationPeriod: {
    start: string;
    end: string;
  };
  geographicalCoverage: string;
  qualityInfo: string;
  scaleFactor: number;
  addOffset: number;
  fillValue: number | string;
  validRange: [number, number];
  recommendedMethod: StatisticalMethodPreference;
  methodRationale: string;
  practicalSignificanceThresholdPerDecade: number;
  verifiedMetadata: boolean;
  palette: 'thermal' | 'vegetation' | 'hydrology' | 'aerosol' | 'cryosphere';
}

export interface BenchmarkRegion {
  id: string;
  name: string;
  countryOrZone: string;
  biome: string;
  lat: number;
  lon: number;
  radiusKm: number;
  description: string;
}

export interface InvestigationRequest {
  variableId: string;
  regionName: string;
  lat: number;
  lon: number;
  radiusKm: number;
  comparisonRegion?: {
    name: string;
    lat: number;
    lon: number;
    radiusKm: number;
  } | null;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  spatialAggregation: SpatialAggregation;
  temporalAggregation: TemporalAggregation;
  statisticalMethod: StatisticalMethodPreference;
  alpha: number; // 0.01 | 0.05 | 0.10
  deseasonalize: boolean;
  gridResolution?: number; // e.g., 3 (3x3 grid) or 4 (4x4 grid)
}

export interface RawObservationPoint {
  date: string;
  rawValue: number | null;
  qcFlag: number | null;
  qcPassed: boolean;
  rejectionReason?: string;
}

export interface ProcessedTimePoint {
  date: string;
  decimalYear: number;
  value: number;
  deseasonalizedValue: number;
  seasonalComponent: number;
  trendComponent: number;
  residualComponent: number;
  isOutlier: boolean;
  zScoreModified: number;
  validCellCount: number;
  totalCellCount: number;
  coveragePct: number;
}

export interface SeasonalBucketStat {
  season: 'DJF' | 'MAM' | 'JJA' | 'SON';
  label: string;
  mean: number;
  stdDev: number;
  sensSlopePerDecade: number;
  mkPValue: number;
  n: number;
}

export interface TrendStatistics {
  methodSelected: string;
  methodRationale: string;
  nTotalRaw: number;
  nValidObservations: number;
  nQcRejected: number;
  nMissingOrFill: number;
  nOutliersFlagged: number;
  coveragePercentage: number;
  meanValue: number;
  medianValue: number;
  stdDev: number;
  detrendedStdDev: number;
  minValue: number;
  maxValue: number;
  // OLS Regression
  olsSlopePerYear: number;
  olsSlopePerDecade: number;
  olsIntercept: number;
  olsR2: number;
  olsStandardErrorPerYear: number;
  olsCi95LowerPerDecade: number;
  olsCi95UpperPerDecade: number;
  olsPValue: number;
  // Non-parametric Sen's Slope
  sensSlopePerYear: number;
  sensSlopePerDecade: number;
  sensCi95LowerPerDecade: number;
  sensCi95UpperPerDecade: number;
  totalEstimatedChange: number;
  // Mann-Kendall & Autocorrelation Adjustment
  mkS: number;
  mkTau: number;
  mkZ: number;
  mkPValue: number;
  lag1Autocorrelation: number;
  effectiveSampleSize: number;
  modifiedMkZ: number;
  modifiedMkPValue: number;
  // Final Decision
  activePValue: number;
  alpha: number;
  isStatisticallySignificant: boolean;
  trendDirection: 'increasing' | 'decreasing' | 'no_significant_trend';
  isPracticallyImportant: boolean;
  practicalImportanceNote: string;
}

export interface SpatialCellResult {
  cellId: string;
  row: number;
  col: number;
  lat: number;
  lon: number;
  bounds: [[number, number], [number, number]];
  meanValue: number;
  sensSlopePerDecade: number;
  olsSlopePerDecade: number;
  mkZ: number;
  pValue: number;
  fdrQValue: number;
  isSignificantRaw: boolean;
  isSignificantFdr: boolean;
  direction: 'increasing' | 'decreasing' | 'no_significant_trend';
  validObservations: number;
  coveragePct: number;
}

export interface PipelineStepLog {
  stage: string;
  status: 'completed' | 'warning' | 'fallback';
  detail: string;
  durationMs: number;
}

export interface DiscoverySummary {
  headline: string;
  whatIsChanging: string;
  whereIsItChanging: string;
  howMuchIsItChanging: string;
  isItSignificant: string;
  dataSupportAndCoverage: string;
  comparisonContrast: string | null;
  uncertaintyAndLimitations: string[];
}

export interface InvestigationResult {
  investigationId: string;
  executedAt: string;
  dataMode: 'live_verified' | 'demonstration_fallback';
  dataModeExplanation: string;
  variable: DatasetVariable;
  request: InvestigationRequest;
  provenance: {
    sourceApiUrls: string[];
    cmrConceptId?: string;
    scaleFactorApplied: number;
    addOffsetApplied: number;
    unitOutput: string;
    qcRuleApplied: string;
    retrievalDurationMs: number;
  };
  pipelineSteps: PipelineStepLog[];
  rawSamplePreview: RawObservationPoint[];
  timeSeries: ProcessedTimePoint[];
  seasonalBreakdown: SeasonalBucketStat[];
  statistics: TrendStatistics;
  spatialCells: SpatialCellResult[];
  comparisonResult?: {
    regionName: string;
    lat: number;
    lon: number;
    timeSeries: ProcessedTimePoint[];
    statistics: TrendStatistics;
  } | null;
  discovery: DiscoverySummary;
}

export interface CmrVerificationInfo {
  datasetId: string;
  cmrShortName: string;
  verified: boolean;
  conceptId?: string;
  title?: string;
  versionId?: string;
  timeStart?: string;
  timeEnd?: string;
  boxes?: string[];
  dataCenter?: string;
  checkedAt: string;
  error?: string;
}

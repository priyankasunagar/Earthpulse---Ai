import React from 'react';
import { Play, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type {
  BenchmarkRegion,
  DatasetVariable,
  InvestigationRequest,
  SpatialAggregation,
  StatisticalMethodPreference,
  TemporalAggregation,
} from '../types/earthpulse';
import { SpatialTrendMap } from '../components/SpatialTrendMap';

interface InvestigationBuilderViewProps {
  variables: DatasetVariable[];
  benchmarkRegions: BenchmarkRegion[];
  config: InvestigationRequest;
  onChangeConfig: (next: InvestigationRequest) => void;
  onRunInvestigation: () => void;
  isRunning: boolean;
  errorMsg: string | null;
}

const PIPELINE_STAGES = [
  'Data Discovery & Metadata Check',
  'Live Satellite / Reanalysis Retrieval',
  'Data Validation & Scale Factoring',
  'Quality Control & Bitmask Filtering',
  'Spatiotemporal Aggregation & Deseasonalization',
  'Sen\'s Slope, OLS & Modified Mann-Kendall',
  'Benjamini-Hochberg FDR & Spatial Mapping',
  'Automated Scientific Discovery Synthesis',
];

export const InvestigationBuilderView: React.FC<InvestigationBuilderViewProps> = ({
  variables,
  benchmarkRegions,
  config,
  onChangeConfig,
  onRunInvestigation,
  isRunning,
  errorMsg,
}) => {
  const activeVariable =
    variables.find((v) => v.id === config.variableId) ?? variables[0];

  const update = (patch: Partial<InvestigationRequest>) => {
    onChangeConfig({ ...config, ...patch });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">
            Investigation Builder
          </h1>
          <p className="text-sm text-slate-400">
            Configure variable, dataset, geographical boundaries, temporal cadence, and statistical methodology before running the pipeline.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunInvestigation}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{isRunning ? 'Running Pipeline...' : 'Run Investigation'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Investigation Pipeline Error</div>
            <p className="text-xs text-rose-300 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Configuration Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Variable & Dataset */}
          <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-4">
            <div className="font-mono text-xs text-cyan-400">01. Variable &amp; Dataset Selection</div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Earth-System Variable &amp; Source Mission
              </label>
              <select
                value={config.variableId}
                onChange={(e) => update({ variableId: e.target.value })}
                className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                {variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.category}] {v.variableName} — {v.datasetId} ({v.unit})
                  </option>
                ))}
              </select>
            </div>

            {activeVariable && (
              <div className="rounded border border-slate-800 bg-[#07090E] p-3.5 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                  <span>
                    Source: <strong className="text-slate-100">{activeVariable.dataSource}</strong>
                  </span>
                  <span className="font-mono text-cyan-400">
                    {activeVariable.spatialResolution} · {activeVariable.temporalResolution}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {activeVariable.physicalMeaningNote}
                </p>
              </div>
            )}
          </section>

          {/* 2. Geographical & Comparison Region */}
          <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-4">
            <div className="font-mono text-xs text-cyan-400">
              02. Geographical Region &amp; Comparison Control
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Benchmark Preset
                </label>
                <select
                  value={
                    benchmarkRegions.find(
                      (b) =>
                        Math.abs(b.lat - config.lat) < 0.05 &&
                        Math.abs(b.lon - config.lon) < 0.05
                    )?.id ?? ''
                  }
                  onChange={(e) => {
                    const bm = benchmarkRegions.find((b) => b.id === e.target.value);
                    if (bm) {
                      update({
                        regionName: bm.name,
                        lat: bm.lat,
                        lon: bm.lon,
                        radiusKm: bm.radiusKm,
                      });
                    }
                  }}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Custom Map Coordinates</option>
                  {benchmarkRegions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Comparison Region (Optional)
                </label>
                <select
                  value={config.comparisonRegion?.name ?? ''}
                  onChange={(e) => {
                    const bm = benchmarkRegions.find((b) => b.name === e.target.value);
                    update({
                      comparisonRegion: bm
                        ? {
                            name: bm.name,
                            lat: bm.lat,
                            lon: bm.lon,
                            radiusKm: bm.radiusKm,
                          }
                        : null,
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">None (Primary region only)</option>
                  {benchmarkRegions.map((b) => (
                    <option key={b.id} value={b.name}>
                      Compare vs. {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.lat}
                  onChange={(e) => update({ lat: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.lon}
                  onChange={(e) => update({ lon: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Radius (km)</label>
                <input
                  type="number"
                  min={5}
                  max={250}
                  value={config.radiusKm}
                  onChange={(e) => update({ radiusKm: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Spatial Grid</label>
                <select
                  value={config.gridResolution ?? 3}
                  onChange={(e) => update({ gridResolution: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value={2}>2×2 (4 cells)</option>
                  <option value={3}>3×3 (9 cells)</option>
                  <option value={4}>4×4 (16 cells)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. Temporal & Statistical Parameters */}
          <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-4">
            <div className="font-mono text-xs text-cyan-400">
              03. Temporal Window &amp; Statistical Methodology
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={config.startDate}
                  min={activeVariable?.observationPeriod.start ?? '1981-01-01'}
                  max={config.endDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={config.endDate}
                  min={config.startDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Temporal Aggregation
                </label>
                <select
                  value={config.temporalAggregation}
                  onChange={(e) =>
                    update({ temporalAggregation: e.target.value as TemporalAggregation })
                  }
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="native">Native Resolution</option>
                  <option value="monthly">Monthly Composite</option>
                  <option value="seasonal">Seasonal (DJF/MAM/JJA/SON)</option>
                  <option value="annual">Annual Mean</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Spatial Aggregation
                </label>
                <select
                  value={config.spatialAggregation}
                  onChange={(e) =>
                    update({ spatialAggregation: e.target.value as SpatialAggregation })
                  }
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="grid_cells">Cell-by-Cell + Regional Mean</option>
                  <option value="regional_mean">Regional Mean</option>
                  <option value="regional_median">Regional Median (Outlier Robust)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Significance Level (α)
                </label>
                <select
                  value={config.alpha}
                  onChange={(e) => update({ alpha: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value={0.01}>α = 0.01 (99% confidence)</option>
                  <option value={0.05}>α = 0.05 (95% confidence)</option>
                  <option value={0.1}>α = 0.10 (90% confidence)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-center">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Statistical Test Method
                </label>
                <select
                  value={config.statisticalMethod}
                  onChange={(e) =>
                    update({
                      statisticalMethod: e.target.value as StatisticalMethodPreference,
                    })
                  }
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-2.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="auto">
                    Auto-Select Recommended for Variable
                  </option>
                  <option value="modified_mk_hamed_rao">
                    Hamed-Rao Modified Mann-Kendall + Sen&apos;s Slope
                  </option>
                  <option value="seasonal_mk">
                    Seasonal Mann-Kendall + Theil-Sen Slope
                  </option>
                  <option value="mann_kendall_sens">
                    Standard Mann-Kendall + Sen&apos;s Slope
                  </option>
                  <option value="ols_parametric">
                    OLS Parametric Linear Regression
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 pt-4 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.deseasonalize}
                  onChange={(e) => update({ deseasonalize: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-[#07090E] accent-cyan-500"
                />
                <span>Apply additive seasonal decomposition prior to trend testing</span>
              </label>
            </div>

            {activeVariable && (
              <div className="rounded border border-slate-800 bg-[#07090E] p-3 text-xs text-slate-400 leading-relaxed">
                <span className="font-medium text-cyan-400">Methodological Rationale: </span>
                {activeVariable.methodRationale}
              </div>
            )}
          </section>
        </div>

        {/* Right Interactive Region Map + Pipeline Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-100">
                Target Region Footprint
              </span>
              <span className="font-mono text-xs text-cyan-400">
                {config.lat.toFixed(3)}°, {config.lon.toFixed(3)}° · r={config.radiusKm} km
              </span>
            </div>
            <SpatialTrendMap
              centerLat={config.lat}
              centerLon={config.lon}
              radiusKm={config.radiusKm}
              mode="picker"
              heightClass="h-[310px]"
              onPickCoordinate={(lat, lon) =>
                update({
                  regionName: `Custom Region (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
                  lat,
                  lon,
                })
              }
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-slate-100">
                Execution Pipeline Stages
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                {isRunning ? 'Executing...' : 'Ready'}
              </span>
            </div>

            <ol className="space-y-2 text-xs">
              {PIPELINE_STAGES.map((stage, i) => (
                <li key={stage} className="flex items-center gap-2.5 text-slate-300">
                  {isRunning ? (
                    <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  )}
                  <span className="font-mono text-slate-500">0{i + 1}.</span>
                  <span>{stage}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={onRunInvestigation}
              disabled={isRunning}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{isRunning ? 'Retrieving & Analysing Data...' : 'Run Investigation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

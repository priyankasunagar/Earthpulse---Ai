import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { Data } from 'plotly.js-dist-min';
import type { InvestigationResult, SpatialCellResult } from '../types/earthpulse';
import { PlotlyChart } from '../components/PlotlyChart';
import { SpatialTrendMap } from '../components/SpatialTrendMap';
import type { AppSection } from '../components/TopNav';

interface AnalysisLaboratoryViewProps {
  result: InvestigationResult;
  activeSubTab: 'laboratory' | 'trends';
  onSwitchTab: (tab: AppSection) => void;
}

function fmtSigned(n: number, dec = 3): string {
  const s = n.toFixed(dec);
  return n > 0 ? `+${s}` : s;
}

export const AnalysisLaboratoryView: React.FC<AnalysisLaboratoryViewProps> = ({
  result,
  activeSubTab,
  onSwitchTab,
}) => {
  const { variable, statistics, discovery, timeSeries, spatialCells, seasonalBreakdown, comparisonResult } =
    result;

  const [selectedCell, setSelectedCell] = useState<SpatialCellResult | null>(
    spatialCells[Math.floor(spatialCells.length / 2)] ?? null
  );
  const [seriesMode, setSeriesMode] = useState<'deseasonalized' | 'observed' | 'decomposition'>(
    'deseasonalized'
  );

  // 1. Primary Time-Series Plotly Traces
  const timeSeriesTraces: Data[] = useMemo(() => {
    const dates = timeSeries.map((pt) => pt.date);
    const observed = timeSeries.map((pt) => pt.value);
    const deseasonalized = timeSeries.map((pt) => pt.deseasonalizedValue);
    const trendLine = timeSeries.map((pt) => pt.trendComponent);
    const outlierPts = timeSeries.filter((pt) => pt.isOutlier);

    if (seriesMode === 'decomposition') {
      return [
        {
          x: dates,
          y: trendLine,
          type: 'scatter',
          mode: 'lines',
          name: `Sen's Trend Component (${fmtSigned(statistics.sensSlopePerDecade)}/dec)`,
          line: { color: '#f59e0b', width: 2.5 },
        },
        {
          x: dates,
          y: timeSeries.map((pt) => pt.seasonalComponent),
          type: 'scatter',
          mode: 'lines',
          name: 'Seasonal Component (S_t)',
          line: { color: '#06b6d4', width: 1.8 },
        },
        {
          x: dates,
          y: timeSeries.map((pt) => pt.residualComponent),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Irregular Residual (R_t)',
          line: { color: '#64748b', width: 1 },
          marker: { size: 4, color: '#94a3b8' },
        },
      ];
    }

    const traces: Data[] = [
      {
        x: dates,
        y: seriesMode === 'deseasonalized' ? deseasonalized : observed,
        type: 'scatter',
        mode: 'lines+markers',
        name:
          seriesMode === 'deseasonalized'
            ? `Deseasonalized ${variable.shortLabel}`
            : `Observed ${variable.shortLabel}`,
        line: { color: '#22d3ee', width: 1.8 },
        marker: { size: 4, color: '#22d3ee' },
      },
      {
        x: dates,
        y: trendLine,
        type: 'scatter',
        mode: 'lines',
        name: `Theil-Sen Trend (${fmtSigned(statistics.sensSlopePerDecade)} ${variable.unit}/dec)`,
        line: { color: '#f59e0b', width: 2.5 },
      },
      {
        x: dates,
        y: timeSeries.map(
          (pt) => statistics.olsIntercept + statistics.olsSlopePerYear * pt.decimalYear
        ),
        type: 'scatter',
        mode: 'lines',
        name: `OLS Fit (${fmtSigned(statistics.olsSlopePerDecade)} ${variable.unit}/dec)`,
        line: { color: '#a78bfa', width: 1.5, dash: 'dash' },
      },
    ];

    if (outlierPts.length > 0) {
      traces.push({
        x: outlierPts.map((p) => p.date),
        y: outlierPts.map((p) =>
          seriesMode === 'deseasonalized' ? p.deseasonalizedValue : p.value
        ),
        type: 'scatter',
        mode: 'markers',
        name: `Flagged Outliers (|M| > 3.5, n=${outlierPts.length})`,
        marker: { size: 8, color: '#f43f5e', symbol: 'diamond-open', line: { width: 2 } },
      });
    }

    if (comparisonResult && comparisonResult.timeSeries.length > 0) {
      traces.push({
        x: comparisonResult.timeSeries.map((pt) => pt.date),
        y: comparisonResult.timeSeries.map((pt) =>
          seriesMode === 'deseasonalized' ? pt.deseasonalizedValue : pt.value
        ),
        type: 'scatter',
        mode: 'lines',
        name: `Comparison: ${comparisonResult.regionName}`,
        line: { color: '#10b981', width: 1.8, dash: 'dot' },
      });
    }

    return traces;
  }, [timeSeries, seriesMode, variable, statistics, comparisonResult]);

  // 2. Seasonal Breakdown Chart Traces
  const seasonalTraces: Data[] = useMemo(() => {
    return [
      {
        x: seasonalBreakdown.map((s) => s.label),
        y: seasonalBreakdown.map((s) => s.mean),
        error_y: {
          type: 'data',
          array: seasonalBreakdown.map((s) => s.stdDev),
          visible: true,
          color: '#64748b',
        },
        type: 'bar',
        name: `Seasonal Mean ± 1 SD (${variable.unit})`,
        marker: { color: ['#38bdf8', '#22d3ee', '#f59e0b', '#10b981'] },
      },
    ];
  }, [seasonalBreakdown, variable.unit]);

  // 3. Observation Coverage Timeline Traces
  const coverageTraces: Data[] = useMemo(() => {
    return [
      {
        x: timeSeries.map((pt) => pt.date),
        y: timeSeries.map((pt) => pt.coveragePct),
        type: 'bar',
        name: 'Valid Spatial Cell Coverage (%)',
        marker: {
          color: timeSeries.map((pt) =>
            pt.coveragePct >= 80 ? '#10b981' : pt.coveragePct >= 50 ? '#f59e0b' : '#f43f5e'
          ),
        },
      },
    ];
  }, [timeSeries]);

  // 4. Trend Explorer Cell Ranking Traces
  const cellRankingTraces: Data[] = useMemo(() => {
    const sorted = [...spatialCells].sort((a, b) => a.sensSlopePerDecade - b.sensSlopePerDecade);
    return [
      {
        x: sorted.map((c) => c.sensSlopePerDecade),
        y: sorted.map((c) => `${c.cellId} (${c.lat.toFixed(2)}°, ${c.lon.toFixed(2)}°)`),
        type: 'bar',
        orientation: 'h',
        name: `Sen's Slope (${variable.unit}/dec)`,
        marker: {
          color: sorted.map((c) =>
            c.isSignificantFdr
              ? c.sensSlopePerDecade >= 0
                ? '#f59e0b'
                : '#06b6d4'
              : '#475569'
          ),
        },
      },
    ];
  }, [spatialCells, variable.unit]);

  const TrendIcon =
    statistics.trendDirection === 'increasing'
      ? TrendingUp
      : statistics.trendDirection === 'decreasing'
      ? TrendingDown
      : Minus;

  const trendColorClass =
    statistics.trendDirection === 'increasing'
      ? 'text-amber-400'
      : statistics.trendDirection === 'decreasing'
      ? 'text-cyan-400'
      : 'text-slate-300';

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      {/* Sub-navigation Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-slate-400">
            Investigation {result.investigationId} · {variable.datasetId} · {result.request.regionName}
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-100">
            {activeSubTab === 'laboratory'
              ? 'Analysis Laboratory'
              : 'Spatial & Seasonal Trend Explorer'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#0B101B] p-1">
            <button
              type="button"
              onClick={() => onSwitchTab('laboratory')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'laboratory'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Analysis Laboratory
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab('trends')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'trends'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trend Explorer
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab('reports')}
              className="rounded px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Research Report</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSwitchTab('builder')}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#0B101B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Modify Parameters</span>
          </button>
        </div>
      </div>

      {/* Scientific Data Mode & Provenance Banner */}
      {result.dataMode === 'demonstration_fallback' ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-950/30 p-4 text-sm text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Labelled Demonstration Mode Active</div>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
              {result.dataModeExplanation}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Live Verified Observations:</strong> {result.dataModeExplanation}
            </span>
          </span>
          <span className="font-mono text-emerald-400">
            Retrieved in {result.provenance.retrievalDurationMs} ms ·{' '}
            {result.provenance.cmrConceptId
              ? `CMR ${result.provenance.cmrConceptId}`
              : variable.datasetId}
          </span>
        </div>
      )}

      {/* Automated Scientific Discovery Engine Brief */}
      <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1 max-w-4xl">
            <div className="text-xs font-mono text-cyan-400">
              Automated Scientific Discovery Brief
            </div>
            <h2 className="font-display text-lg font-semibold text-slate-50 leading-snug">
              {discovery.headline}
            </h2>
          </div>

          <div className={`flex items-center gap-2 font-mono text-sm font-semibold ${trendColorClass}`}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {statistics.trendDirection === 'increasing'
                ? 'Increasing Trend'
                : statistics.trendDirection === 'decreasing'
                ? 'Decreasing Trend'
                : 'No Significant Trend'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400">01. What Is Changing</div>
            <p className="text-sm leading-relaxed text-slate-300">{discovery.whatIsChanging}</p>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400">02. Where Is It Changing</div>
            <p className="text-sm leading-relaxed text-slate-300">{discovery.whereIsItChanging}</p>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400">03. How Much Is It Changing</div>
            <p className="text-sm leading-relaxed text-slate-300">{discovery.howMuchIsItChanging}</p>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400">
              04. Is The Trend Statistically Significant?
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{discovery.isItSignificant}</p>
          </div>
        </div>

        {discovery.comparisonContrast && (
          <div className="rounded border border-cyan-500/30 bg-[#07090E] p-4 text-sm text-slate-200 leading-relaxed">
            <span className="font-mono text-xs text-cyan-400 block mb-1">
              Regional Comparison Contrast
            </span>
            {discovery.comparisonContrast}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 md:grid-cols-2 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-200 block mb-1">
              Data Support &amp; Coverage
            </span>
            <p className="leading-relaxed">{discovery.dataSupportAndCoverage}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-200 block mb-1">
              Uncertainty &amp; Methodological Limitations
            </span>
            <ul className="space-y-1 list-disc pl-4 leading-relaxed">
              {discovery.uncertaintyAndLimitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4 Calibrated Statistical Telemetry Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-1.5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Theil-Sen Slope (Non-Parametric)
          </div>
          <div className="flex items-baseline">
            <span className="font-mono text-2xl font-semibold text-slate-50">
              {fmtSigned(statistics.sensSlopePerDecade)}
            </span>
            <span className="ml-1.5 font-mono text-xs text-slate-400">
              {variable.unit} / dec
            </span>
          </div>
          <div className="font-mono text-xs text-slate-400">
            95% CI: [{fmtSigned(statistics.sensCi95LowerPerDecade, 2)},{' '}
            {fmtSigned(statistics.sensCi95UpperPerDecade, 2)}]
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-1.5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Statistical Significance (Active Test)
          </div>
          <div className="flex items-baseline">
            <span
              className={`font-mono text-2xl font-semibold ${
                statistics.isStatisticallySignificant ? 'text-emerald-400' : 'text-slate-200'
              }`}
            >
              p = {statistics.activePValue < 0.0001 ? '< 0.0001' : statistics.activePValue.toFixed(4)}
            </span>
          </div>
          <div className="font-mono text-xs text-slate-400">
            Z = {statistics.modifiedMkZ.toFixed(2)} · τ = {statistics.mkTau.toFixed(3)} · α ={' '}
            {statistics.alpha}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-1.5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            OLS Regression &amp; Variance
          </div>
          <div className="flex items-baseline">
            <span className="font-mono text-2xl font-semibold text-slate-50">
              {fmtSigned(statistics.olsSlopePerDecade)}
            </span>
            <span className="ml-1.5 font-mono text-xs text-slate-400">
              {variable.unit} / dec
            </span>
          </div>
          <div className="font-mono text-xs text-slate-400">
            R² = {statistics.olsR2.toFixed(3)} · ρ₁ = {statistics.lag1Autocorrelation.toFixed(2)} (n* ={' '}
            {statistics.effectiveSampleSize.toFixed(0)})
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-1.5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            QC Retention &amp; Valid Coverage
          </div>
          <div className="flex items-baseline">
            <span className="font-mono text-2xl font-semibold text-cyan-400">
              {statistics.coveragePercentage.toFixed(1)}%
            </span>
            <span className="ml-1.5 font-mono text-xs text-slate-400">
              ({statistics.nValidObservations}/{statistics.nTotalRaw})
            </span>
          </div>
          <div className="font-mono text-xs text-slate-400">
            QC Rejected: {statistics.nQcRejected} · Outliers: {statistics.nOutliersFlagged}
          </div>
        </div>
      </section>

      {activeSubTab === 'laboratory' ? (
        <>
          {/* Time-Series & Spatial Trend Map */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-100">
                    Temporal Trajectory &amp; Trend Fit
                  </h3>
                  <p className="text-xs text-slate-400">
                    {statistics.methodSelected}
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded border border-slate-800 bg-[#07090E] p-1">
                  {(
                    [
                      { id: 'deseasonalized', label: 'Deseasonalized' },
                      { id: 'observed', label: 'Raw Observed' },
                      { id: 'decomposition', label: 'Decomposition' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSeriesMode(m.id)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        seriesMode === m.id
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <PlotlyChart
                data={timeSeriesTraces}
                height={360}
                layout={{
                  yaxis: {
                    title: { text: `${variable.shortLabel} (${variable.unit})`, font: { size: 11 } },
                  },
                }}
              />
            </div>

            <div className="lg:col-span-5 rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-100">
                  Spatial Trend &amp; FDR Grid Map
                </h3>
                <p className="text-xs text-slate-400">
                  Switch layers to inspect trend direction, decadal magnitude, FDR significance, and coverage.
                </p>
              </div>

              <SpatialTrendMap
                centerLat={result.request.lat}
                centerLon={result.request.lon}
                radiusKm={result.request.radiusKm}
                spatialCells={spatialCells}
                unit={variable.unit}
                alpha={statistics.alpha}
                selectedCellId={selectedCell?.cellId}
                onSelectCell={setSelectedCell}
                heightClass="h-[325px]"
              />
            </div>
          </section>

          {/* Selected Cell Inspector + Seasonal Comparison + Coverage Timeline */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-100">
                Seasonal Cycle &amp; Inter-Seasonal Rates
              </h3>
              <PlotlyChart
                data={seasonalTraces}
                height={260}
                layout={{
                  yaxis: { title: { text: variable.unit, font: { size: 11 } } },
                }}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-800 pt-3 text-xs">
                {seasonalBreakdown.map((sb) => (
                  <div key={sb.season} className="rounded bg-[#07090E] p-2.5 border border-slate-800/80">
                    <div className="font-mono text-slate-400">{sb.season} (n={sb.n})</div>
                    <div className="font-mono text-sm font-semibold text-slate-100 mt-0.5">
                      {fmtSigned(sb.sensSlopePerDecade, 2)} {variable.unit}/dec
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      p = {sb.mkPValue.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-100">
                Observation Coverage Timeline
              </h3>
              <PlotlyChart
                data={coverageTraces}
                height={260}
                layout={{
                  yaxis: {
                    title: { text: 'Valid Cells (%)', font: { size: 11 } },
                    range: [0, 105],
                  },
                }}
              />
              {selectedCell && (
                <div className="rounded border border-slate-800 bg-[#07090E] p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-cyan-400 font-semibold">
                      Selected Cell {selectedCell.cellId}
                    </span>{' '}
                    <span className="text-slate-400 font-mono">
                      ({selectedCell.lat.toFixed(3)}°, {selectedCell.lon.toFixed(3)}°)
                    </span>
                  </div>
                  <div className="font-mono text-slate-200">
                    Sen: {fmtSigned(selectedCell.sensSlopePerDecade)} {variable.unit}/dec · p ={' '}
                    {selectedCell.pValue.toFixed(4)} · FDR q = {selectedCell.fdrQValue.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* Trend Explorer View */
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-100">
                Spatial Cell Slope Ranking (BH-FDR Highlighted)
              </h3>
              <p className="text-xs text-slate-400">
                Amber/Cyan bars remain statistically significant after Benjamini-Hochberg false discovery rate correction (q &lt; {statistics.alpha}).
              </p>
              <PlotlyChart
                data={cellRankingTraces}
                height={360}
                layout={{
                  margin: { t: 20, r: 20, b: 48, l: 165 },
                  xaxis: {
                    title: { text: `Sen's Slope (${variable.unit} / decade)`, font: { size: 11 } },
                  },
                }}
              />
            </div>

            <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-100">
                Grid Cell Statistical Table
              </h3>
              <div className="max-h-[380px] overflow-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#0B101B] border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Cell</th>
                      <th className="py-2 px-2">Center</th>
                      <th className="py-2 px-2">Sen Slope</th>
                      <th className="py-2 px-2">Raw p</th>
                      <th className="py-2 px-2">FDR q</th>
                      <th className="py-2 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono">
                    {spatialCells.map((c) => (
                      <tr
                        key={c.cellId}
                        onClick={() => setSelectedCell(c)}
                        className={`cursor-pointer hover:bg-slate-800/40 ${
                          selectedCell?.cellId === c.cellId ? 'bg-cyan-500/10' : ''
                        }`}
                      >
                        <td className="py-2 pr-3 text-cyan-400">{c.cellId}</td>
                        <td className="py-2 px-2 text-slate-300">
                          {c.lat.toFixed(2)}°, {c.lon.toFixed(2)}°
                        </td>
                        <td className="py-2 px-2 text-slate-100">
                          {fmtSigned(c.sensSlopePerDecade)}
                        </td>
                        <td className="py-2 px-2 text-slate-300">{c.pValue.toFixed(4)}</td>
                        <td className="py-2 px-2 text-slate-300">{c.fdrQValue.toFixed(4)}</td>
                        <td className="py-2 pl-2 font-sans">
                          {c.isSignificantFdr ? (
                            <span className="text-emerald-400">FDR Sig.</span>
                          ) : c.isSignificantRaw ? (
                            <span className="text-amber-400">Raw Sig.</span>
                          ) : (
                            <span className="text-slate-500">NS</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Raw vs Processed QC Inspection Sample */}
          <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-slate-100">
                Raw vs. Quality-Controlled Record Sample (Center Cell)
              </h3>
              <span className="font-mono text-xs text-slate-400">
                QC Rule: {result.provenance.qcRuleApplied}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Observation Date</th>
                    <th className="py-2 px-3">Scaled Value ({variable.unit})</th>
                    <th className="py-2 px-3">QC Flag</th>
                    <th className="py-2 px-3">QC Status</th>
                    <th className="py-2 pl-3">Diagnostic Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {result.rawSamplePreview.slice(0, 12).map((row, idx) => (
                    <tr key={`${row.date}-${idx}`}>
                      <td className="py-1.5 pr-4 text-slate-200">{row.date}</td>
                      <td className="py-1.5 px-3 text-slate-100">
                        {row.rawValue !== null ? row.rawValue.toFixed(4) : 'NULL'}
                      </td>
                      <td className="py-1.5 px-3 text-slate-400">{row.qcFlag ?? '—'}</td>
                      <td className="py-1.5 px-3 font-sans">
                        {row.qcPassed ? (
                          <span className="text-emerald-400">Passed</span>
                        ) : (
                          <span className="text-rose-400">Rejected</span>
                        )}
                      </td>
                      <td className="py-1.5 pl-3 font-sans text-slate-400">
                        {row.rejectionReason || 'Valid observation retained'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

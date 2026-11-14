import React from 'react';
import { Download, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { InvestigationResult } from '../types/earthpulse';

interface ResearchReportsViewProps {
  result: InvestigationResult;
  onBackToLab: () => void;
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ResearchReportsView: React.FC<ResearchReportsViewProps> = ({
  result,
  onBackToLab,
}) => {
  const { variable, request, statistics, discovery, provenance, pipelineSteps, timeSeries, spatialCells } =
    result;

  const handleDownloadJson = () => {
    triggerDownload(
      `${result.investigationId}_${variable.datasetId}_report.json`,
      JSON.stringify(result, null, 2),
      'application/json'
    );
  };

  const handleDownloadCsv = () => {
    const header = [
      'date',
      'decimal_year',
      `observed_${variable.unit}`,
      `deseasonalized_${variable.unit}`,
      'seasonal_component',
      'trend_component',
      'residual_component',
      'modified_z_score',
      'is_outlier',
      'valid_cells',
      'total_cells',
      'coverage_pct',
    ].join(',');

    const rows = timeSeries.map((pt) =>
      [
        pt.date,
        pt.decimalYear.toFixed(6),
        pt.value.toFixed(5),
        pt.deseasonalizedValue.toFixed(5),
        pt.seasonalComponent.toFixed(5),
        pt.trendComponent.toFixed(5),
        pt.residualComponent.toFixed(5),
        pt.zScoreModified.toFixed(3),
        pt.isOutlier,
        pt.validCellCount,
        pt.totalCellCount,
        pt.coveragePct.toFixed(1),
      ].join(',')
    );

    triggerDownload(
      `${result.investigationId}_${variable.datasetId}_timeseries.csv`,
      [header, ...rows].join('\n'),
      'text/csv;charset=utf-8'
    );
  };

  const handleDownloadMarkdown = () => {
    const md = `# EarthPulse Scientific Investigation Report

- **Investigation ID:** ${result.investigationId}
- **Executed At (UTC):** ${result.executedAt}
- **Data Mode:** ${
      result.dataMode === 'live_verified'
        ? 'Live Verified Observations'
        : 'Labelled Demonstration Fallback'
    }
- **Variable:** ${variable.variableName} (${variable.unit})
- **Dataset:** ${variable.datasetId} — ${variable.datasetName}
- **Mission / Model:** ${variable.missionOrModel}
- **DOI:** ${variable.doi}
- **Region:** ${request.regionName} (${request.lat.toFixed(4)}°, ${request.lon.toFixed(
      4
    )}°, radius ${request.radiusKm} km)
- **Observation Window:** ${request.startDate} to ${request.endDate}

## 1. Executive Discovery Summary

**${discovery.headline}**

- **What is changing:** ${discovery.whatIsChanging}
- **Where is it changing:** ${discovery.whereIsItChanging}
- **How much is it changing:** ${discovery.howMuchIsItChanging}
- **Statistical significance:** ${discovery.isItSignificant}
- **Data support & coverage:** ${discovery.dataSupportAndCoverage}
${discovery.comparisonContrast ? `- **Comparison contrast:** ${discovery.comparisonContrast}` : ''}

## 2. Statistical Test Results

| Metric | Value |
| --- | --- |
| Active Statistical Test | ${statistics.methodSelected} |
| Theil-Sen Slope | ${statistics.sensSlopePerDecade.toFixed(4)} ${variable.unit}/decade |
| Sen's 95% Confidence Interval | [${statistics.sensCi95LowerPerDecade.toFixed(4)}, ${statistics.sensCi95UpperPerDecade.toFixed(4)}] ${variable.unit}/decade |
| OLS Linear Slope | ${statistics.olsSlopePerDecade.toFixed(4)} ${variable.unit}/decade (R² = ${statistics.olsR2.toFixed(4)}) |
| Active p-value | ${statistics.activePValue.toFixed(6)} (α = ${statistics.alpha}) |
| Modified Mann-Kendall Z | ${statistics.modifiedMkZ.toFixed(4)} |
| Kendall tau | ${statistics.mkTau.toFixed(4)} |
| Lag-1 Autocorrelation (detrended) | ${statistics.lag1Autocorrelation.toFixed(4)} (n* = ${statistics.effectiveSampleSize.toFixed(1)}) |
| Valid Observations | ${statistics.nValidObservations} / ${statistics.nTotalRaw} (${statistics.coveragePercentage.toFixed(1)}%) |

## 3. Spatial Grid Cells (BH-FDR Adjusted)

| Cell | Lat | Lon | Sen Slope (${variable.unit}/dec) | Raw p | FDR q | Direction |
| --- | --- | --- | --- | --- | --- | --- |
${spatialCells
  .map(
    (c) =>
      `| ${c.cellId} | ${c.lat.toFixed(3)} | ${c.lon.toFixed(3)} | ${c.sensSlopePerDecade.toFixed(
        4
      )} | ${c.pValue.toFixed(4)} | ${c.fdrQValue.toFixed(4)} | ${c.direction} |`
  )
  .join('\n')}

## 4. Provenance, Quality Control & Limitations

- **Scale Factor & Offset:** ×${provenance.scaleFactorApplied} + (${provenance.addOffsetApplied})
- **QC Rule Applied:** ${provenance.qcRuleApplied}
- **Method Rationale:** ${statistics.methodRationale}

### Uncertainty & Limitations
${discovery.uncertaintyAndLimitations.map((u) => `- ${u}`).join('\n')}
`;
    triggerDownload(
      `${result.investigationId}_${variable.datasetId}_report.md`,
      md,
      'text/markdown;charset=utf-8'
    );
  };

  return (
    <div className="mx-auto max-w-[1160px] px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToLab}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Analysis Laboratory</span>
          </button>
          <h1 className="font-display text-2xl font-bold text-slate-100">
            Reproducible Scientific Research Report
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#0B101B] px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#0B101B] px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Report (.md)</span>
          </button>
        </div>
      </div>

      {/* Report Document Body */}
      <article className="rounded-lg border border-slate-800 bg-[#0B101B] p-8 space-y-8">
        <header className="border-b border-slate-800 pb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-400">
            <span>Report ID: {result.investigationId}</span>
            <span>Executed: {new Date(result.executedAt).toUTCString()}</span>
          </div>

          <h2 className="font-display text-xl font-bold text-slate-50">
            {discovery.headline}
          </h2>

          <div className="flex items-center gap-2 text-xs">
            {result.dataMode === 'live_verified' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified Live Observations ({variable.dataSource})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Labelled Demonstration Fallback Mode</span>
              </span>
            )}
          </div>
        </header>

        {/* Provenance Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs border-b border-slate-800 pb-6">
          <div>
            <div className="text-slate-400">Dataset &amp; Identifier</div>
            <div className="font-mono text-slate-100 mt-0.5">{variable.datasetId}</div>
          </div>
          <div>
            <div className="text-slate-400">Mission / Model</div>
            <div className="text-slate-100 mt-0.5">{variable.missionOrModel}</div>
          </div>
          <div>
            <div className="text-slate-400">Digital Object Identifier (DOI)</div>
            <div className="font-mono text-cyan-400 mt-0.5">{variable.doi}</div>
          </div>
          <div>
            <div className="text-slate-400">Region &amp; Center Coordinates</div>
            <div className="font-mono text-slate-100 mt-0.5">
              {request.regionName} ({request.lat.toFixed(3)}°, {request.lon.toFixed(3)}°)
            </div>
          </div>
          <div>
            <div className="text-slate-400">Observation Period</div>
            <div className="font-mono text-slate-100 mt-0.5">
              {request.startDate} to {request.endDate}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Resolution &amp; Aggregation</div>
            <div className="font-mono text-slate-100 mt-0.5">
              {variable.spatialResolution} · {request.temporalAggregation}
            </div>
          </div>
        </section>

        {/* Narrative Findings */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="font-display text-base font-semibold text-slate-100">
            1. Scientific Findings
          </h3>
          <p>
            <strong className="text-slate-100">Variable &amp; Physical Meaning: </strong>
            {discovery.whatIsChanging}
          </p>
          <p>
            <strong className="text-slate-100">Spatial Pattern: </strong>
            {discovery.whereIsItChanging}
          </p>
          <p>
            <strong className="text-slate-100">Magnitude of Change: </strong>
            {discovery.howMuchIsItChanging}
          </p>
          <p>
            <strong className="text-slate-100">Statistical Significance &amp; Practical Relevance: </strong>
            {discovery.isItSignificant}
          </p>
          {discovery.comparisonContrast && (
            <p>
              <strong className="text-slate-100">Comparison Region Contrast: </strong>
              {discovery.comparisonContrast}
            </p>
          )}
        </section>

        {/* Pipeline Execution Audit */}
        <section className="space-y-3 border-t border-slate-800 pt-6">
          <h3 className="font-display text-base font-semibold text-slate-100">
            2. Processing Pipeline Audit Trail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Pipeline Stage</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Processing Detail</th>
                  <th className="py-2 pl-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {pipelineSteps.map((step, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 font-medium text-slate-200">{step.stage}</td>
                    <td className="py-2 px-3 font-mono text-emerald-400">{step.status}</td>
                    <td className="py-2 px-3 text-slate-300">{step.detail}</td>
                    <td className="py-2 pl-3 text-right font-mono text-slate-400">
                      {step.durationMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Source API Provenance & Limitations */}
        <section className="space-y-3 border-t border-slate-800 pt-6 text-xs text-slate-400">
          <h3 className="font-display text-base font-semibold text-slate-100">
            3. Source Endpoints, Quality Rules &amp; Limitations
          </h3>
          <div>
            <span className="font-semibold text-slate-200">Quality Control Rule: </span>
            <span className="font-mono">{provenance.qcRuleApplied}</span>
          </div>
          {provenance.sourceApiUrls.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-200 block">
                Representative Upstream API Calls:
              </span>
              {provenance.sourceApiUrls.map((url) => (
                <div key={url} className="font-mono text-[11px] text-cyan-400 break-all">
                  {url}
                </div>
              ))}
            </div>
          )}
          <ul className="list-disc pl-5 space-y-1 pt-2 text-slate-300">
            {discovery.uncertaintyAndLimitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { Search, CheckCircle2, ShieldCheck, ExternalLink, ArrowRight, Scale } from 'lucide-react';
import type { CmrVerificationInfo, DatasetVariable, VariableCategory } from '../types/earthpulse';

interface DataDiscoveryViewProps {
  variables: DatasetVariable[];
  selectedVariableId: string;
  onSelectForInvestigation: (variableId: string) => void;
}

const CATEGORIES: Array<'All' | VariableCategory> = [
  'All',
  'Temperature',
  'Vegetation',
  'Water',
  'Atmosphere',
  'Land & Environment',
];

export const DataDiscoveryView: React.FC<DataDiscoveryViewProps> = ({
  variables,
  selectedVariableId,
  onSelectForInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | VariableCategory>('All');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [cmrResults, setCmrResults] = useState<Record<string, CmrVerificationInfo>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const filteredVariables = useMemo(() => {
    return variables.filter((v) => {
      if (!v.verifiedMetadata) return false;
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.variableName.toLowerCase().includes(q) ||
        v.datasetId.toLowerCase().includes(q) ||
        v.missionOrModel.toLowerCase().includes(q) ||
        v.scientificDescription.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    });
  }, [variables, categoryFilter, searchQuery]);

  const comparedDatasets = useMemo(
    () => variables.filter((v) => compareIds.includes(v.id)),
    [variables, compareIds]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
        ? [...prev.slice(1), id]
        : [...prev, id]
    );
  };

  const handleVerifyCmr = async (variableId: string) => {
    setVerifyingId(variableId);
    try {
      const res = await fetch(`/api/discovery/verify/${encodeURIComponent(variableId)}`);
      if (res.ok) {
        const info = (await res.json()) as CmrVerificationInfo;
        setCmrResults((prev) => ({ ...prev, [variableId]: info }));
      }
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-slate-100">
            Earth Science Data Discovery Engine
          </h1>
          <p className="text-sm text-slate-400">
            Explore verified Earth-system variables, inspect units and quality flags, verify NASA CMR records, and compare datasets side-by-side.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variable, MODIS, ERA5, unit..."
            className="w-full rounded-md border border-slate-700 bg-[#0B101B] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-800 bg-[#0B101B] p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="font-mono text-xs text-slate-400">
          Showing {filteredVariables.length} verified variables
          {compareIds.length > 0 && ` · ${compareIds.length} selected for comparison`}
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix when >= 2 selected */}
      {comparedDatasets.length >= 2 && (
        <section className="rounded-lg border border-cyan-500/40 bg-[#0B101B] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Scale className="h-4 w-4" />
              <span>Side-by-Side Dataset Comparison ({comparedDatasets.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Clear comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-4 font-medium">Property</th>
                  {comparedDatasets.map((d) => (
                    <th key={d.id} className="py-2 px-3 font-semibold text-slate-100">
                      {d.variableName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Dataset ID</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 font-mono text-cyan-400">
                      {d.datasetId}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Unit</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 font-mono text-slate-200">
                      {d.unit}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Spatial Resolution</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 font-mono text-slate-200">
                      {d.spatialResolution}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Temporal Resolution</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 text-slate-200">
                      {d.temporalResolution}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Observation Span</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 font-mono text-slate-200">
                      {d.observationPeriod.start} – {d.observationPeriod.end}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Scale &amp; Offset</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 font-mono text-slate-200">
                      ×{d.scaleFactor} + ({d.addOffset})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-slate-400">Physical Distinction</td>
                  {comparedDatasets.map((d) => (
                    <td key={d.id} className="py-2 px-3 text-slate-300 leading-relaxed">
                      {d.physicalMeaningNote}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Variable Catalog Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredVariables.map((v) => {
          const cmr = cmrResults[v.id];
          const isSelected = selectedVariableId === v.id;
          const isCompared = compareIds.includes(v.id);

          return (
            <article
              key={v.id}
              className={`rounded-lg border bg-[#0B101B] p-6 flex flex-col justify-between space-y-4 ${
                isSelected ? 'border-cyan-500/70' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Quiet unboxed metadata line */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>
                    {v.category} · {v.missionOrModel} ·{' '}
                    <span className="font-mono text-cyan-400">{v.datasetId}</span>
                  </span>
                  <span className="font-mono text-slate-300">Unit: {v.unit}</span>
                </div>

                <h2 className="font-display text-lg font-semibold text-slate-100">
                  {v.variableName}
                </h2>

                <p className="text-sm leading-relaxed text-slate-300">
                  {v.scientificDescription}
                </p>

                <p className="text-xs leading-relaxed text-amber-300/90">
                  Physical Note: {v.physicalMeaningNote}
                </p>

                {/* Technical Specs Table */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-800/80 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400">Spatial Resolution: </span>
                    <span className="font-mono text-slate-200">{v.spatialResolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Temporal Cadence: </span>
                    <span className="font-mono text-slate-200">{v.temporalResolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Observation Period: </span>
                    <span className="font-mono text-slate-200">
                      {v.observationPeriod.start} – {v.observationPeriod.end}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Coverage: </span>
                    <span className="text-slate-200">{v.geographicalCoverage}</span>
                  </div>
                </div>

                <div className="rounded bg-[#07090E] border border-slate-800/80 p-3 text-xs text-slate-400 leading-relaxed">
                  <span className="font-medium text-slate-300">Quality &amp; Calibration: </span>
                  {v.qualityInfo}
                </div>

                {cmr && (
                  <div className="rounded border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        NASA CMR Verified: {cmr.conceptId || cmr.cmrShortName}
                        {cmr.dataCenter ? ` · ${cmr.dataCenter}` : ''}
                      </span>
                    </span>
                    {cmr.timeStart && (
                      <span className="font-mono text-[11px] text-emerald-400">
                        Archive Start: {cmr.timeStart.slice(0, 10)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleVerifyCmr(v.id)}
                    disabled={verifyingId === v.id}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#07090E] px-2.5 py-1.5 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{verifyingId === v.id ? 'Checking CMR...' : 'Verify NASA CMR'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCompare(v.id)}
                    className={`rounded border px-2.5 py-1.5 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      isCompared
                        ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                        : 'border-slate-700 bg-[#07090E] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {isCompared ? 'In Comparison' : 'Compare'}
                  </button>

                  <a
                    href={v.documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 whitespace-nowrap"
                  >
                    <span>Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectForInvestigation(v.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Investigate Variable</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

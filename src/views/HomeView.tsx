import React from 'react';
import { ArrowRight, Compass, Database, FlaskConical, FileText } from 'lucide-react';
import type { BenchmarkRegion, DatasetVariable } from '../types/earthpulse';
import { EarthGlobe3D } from '../components/EarthGlobe3D';
import type { AppSection } from '../components/TopNav';

interface HomeViewProps {
  selectedLat: number;
  selectedLon: number;
  regionName: string;
  benchmarkRegions: BenchmarkRegion[];
  variablesCount: number;
  onSelectLocation: (lat: number, lon: number, matched?: BenchmarkRegion) => void;
  onQuickInvestigate: (variableId: string, region: BenchmarkRegion) => void;
  onNavigate: (section: AppSection) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  selectedLat,
  selectedLon,
  regionName,
  benchmarkRegions,
  variablesCount,
  onSelectLocation,
  onQuickInvestigate,
  onNavigate,
}) => {
  const featuredPresets = [
    {
      label: 'Bengaluru Urban Heat (LST)',
      variableId: 'nasa_power_ts',
      region: benchmarkRegions[0],
    },
    {
      label: 'Amazon Canopy Productivity',
      variableId: 'mod13a2_evi',
      region: benchmarkRegions[1],
    },
    {
      label: 'Svalbard Arctic Warming',
      variableId: 'nasa_power_t2m',
      region: benchmarkRegions[2],
    },
    {
      label: 'Indo-Gangetic Aerosol Loading',
      variableId: 'nasa_power_aod',
      region: benchmarkRegions[5],
    },
  ].filter((p) => Boolean(p.region));

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-12">
      {/* Hero Split: Editorial Scientific Brief + Interactive 3D Earth Globe */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-between rounded-lg border border-slate-800 bg-[#0B101B] p-8">
          <div className="space-y-6">
            <div className="text-xs font-mono tracking-wider text-cyan-400">
              EarthPulse · Earth System Trend Detective
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 leading-tight text-balance">
              Discover What Is Changing. Understand Where. Measure How Much.
            </h1>

            <p className="text-base leading-relaxed text-slate-300">
              Investigate multi-decadal shifts across land surface temperature, vegetation
              productivity, hydrological balance, aerosols, and cryosphere cover using live
              NASA satellite and Earth-system reanalysis observations.
            </p>

            <div className="space-y-2 border-t border-slate-800 pt-5 text-sm text-slate-300">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-slate-400">Verified Datasets</span>
                <span className="font-mono text-slate-100">{variablesCount} Earth-System Variables</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-slate-400">Statistical Rigor</span>
                <span className="font-mono text-slate-100">Sen&apos;s Slope · Modified MK · BH-FDR</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-slate-400">Active Target</span>
                <span className="font-mono text-cyan-400 truncate max-w-[230px]">
                  {regionName}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('builder')}
                className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Configure Investigation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('discovery')}
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Explore Datasets</span>
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-4">
              <div className="text-xs font-medium text-slate-400 mb-2.5">
                Quick-Launch Benchmark Investigations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {featuredPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onQuickInvestigate(preset.variableId, preset.region)}
                    className="text-left rounded border border-slate-800 bg-[#07090E] px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer truncate"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <EarthGlobe3D
            selectedLat={selectedLat}
            selectedLon={selectedLon}
            regionName={regionName}
            benchmarkRegions={benchmarkRegions}
            onSelectLocation={onSelectLocation}
            heightClass="h-[520px] lg:h-full min-h-[520px]"
          />
        </div>
      </section>

      {/* Four Fundamental Scientific Questions Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-2">
          <div className="font-mono text-xs text-cyan-400">01. What Is Changing</div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Verified Variable Discovery
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Distinguish radiative Land Surface Temperature from 2m air temperature, vegetation
            indices, precipitation, soil water, and aerosols with exact units and scale factors.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-2">
          <div className="font-mono text-xs text-cyan-400">02. Where Is It Changing</div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Multi-Cell Spatial Grids
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Inspect spatial heterogeneity across gridded satellite footprints and compare urban
            regions against adjacent forested control zones.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-2">
          <div className="font-mono text-xs text-cyan-400">03. How Much</div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Sen&apos;s Slope &amp; OLS Rates
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Quantify decadal change rates with non-parametric Theil-Sen slopes, 95% confidence
            intervals, and seasonal decomposition.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-2">
          <div className="font-mono text-xs text-cyan-400">04. Is It Significant</div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Autocorrelation &amp; FDR Control
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Test monotonic significance via Hamed-Rao Modified Mann-Kendall and Benjamini-Hochberg
            false discovery rate correction across spatial cells.
          </p>
        </div>
      </section>

      {/* Workflow Navigation Cards */}
      <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-100">
              End-to-End Scientific Investigation Pipeline
            </h2>
            <p className="text-sm text-slate-400">
              Move cleanly from orbital region picking and dataset validation to statistical inference and reproducible reporting.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400">
            NASA CMR · ORNL DAAC · NASA POWER · ECMWF ERA5
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <button
            type="button"
            onClick={() => onNavigate('explorer')}
            className="text-left rounded-md border border-slate-800 bg-[#07090E] p-4 hover:border-cyan-500/50 transition-colors cursor-pointer space-y-2"
          >
            <Compass className="h-4 w-4 text-cyan-400" />
            <div className="font-display text-sm font-semibold text-slate-100">
              Earth Explorer
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select custom regions on the 3D globe or 2D map and pair comparison zones.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('discovery')}
            className="text-left rounded-md border border-slate-800 bg-[#07090E] p-4 hover:border-cyan-500/50 transition-colors cursor-pointer space-y-2"
          >
            <Database className="h-4 w-4 text-cyan-400" />
            <div className="font-display text-sm font-semibold text-slate-100">
              Data Discovery
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filter variables, verify NASA CMR collection metadata, and inspect QC bitmasks.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="text-left rounded-md border border-slate-800 bg-[#07090E] p-4 hover:border-cyan-500/50 transition-colors cursor-pointer space-y-2"
          >
            <FlaskConical className="h-4 w-4 text-cyan-400" />
            <div className="font-display text-sm font-semibold text-slate-100">
              Investigation &amp; Lab
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Execute retrieval, seasonal decomposition, Sen&apos;s slope, and spatial trend maps.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('sources')}
            className="text-left rounded-md border border-slate-800 bg-[#07090E] p-4 hover:border-cyan-500/50 transition-colors cursor-pointer space-y-2"
          >
            <FileText className="h-4 w-4 text-cyan-400" />
            <div className="font-display text-sm font-semibold text-slate-100">
              Reports &amp; Sources
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export CSV/JSON/Markdown reports with full dataset DOIs and methodological limits.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};

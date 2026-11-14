import React, { useState } from 'react';
import { ArrowRight, MapPin, GitCompare } from 'lucide-react';
import type { BenchmarkRegion } from '../types/earthpulse';
import { EarthGlobe3D } from '../components/EarthGlobe3D';
import { SpatialTrendMap } from '../components/SpatialTrendMap';

interface EarthExplorerViewProps {
  selectedLat: number;
  selectedLon: number;
  regionName: string;
  radiusKm: number;
  comparisonRegion: { name: string; lat: number; lon: number; radiusKm: number } | null;
  benchmarkRegions: BenchmarkRegion[];
  onChangeRegion: (params: {
    name: string;
    lat: number;
    lon: number;
    radiusKm: number;
  }) => void;
  onChangeComparison: (
    comp: { name: string; lat: number; lon: number; radiusKm: number } | null
  ) => void;
  onProceedToBuilder: () => void;
}

export const EarthExplorerView: React.FC<EarthExplorerViewProps> = ({
  selectedLat,
  selectedLon,
  regionName,
  radiusKm,
  comparisonRegion,
  benchmarkRegions,
  onChangeRegion,
  onChangeComparison,
  onProceedToBuilder,
}) => {
  const [viewportMode, setViewportMode] = useState<'globe' | 'map'>('globe');

  const handleBenchmarkSelect = (reg: BenchmarkRegion) => {
    onChangeRegion({
      name: reg.name,
      lat: reg.lat,
      lon: reg.lon,
      radiusKm: reg.radiusKm,
    });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">
            Earth Explorer &amp; Geographical Selection
          </h1>
          <p className="text-sm text-slate-400">
            Click anywhere on the 3D globe or 2D map to target coordinates, or select an Earth-system benchmark region.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#0B101B] p-1">
            <button
              type="button"
              onClick={() => setViewportMode('globe')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewportMode === 'globe'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Orbital Globe
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('map')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewportMode === 'map'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D Geospatial Map
            </button>
          </div>

          <button
            type="button"
            onClick={onProceedToBuilder}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Configure Investigation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Control & Benchmark Panel */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Coordinates Form */}
          <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span>Primary Investigation Region</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Region Label</label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(e) =>
                    onChangeRegion({
                      name: e.target.value,
                      lat: selectedLat,
                      lon: selectedLon,
                      radiusKm,
                    })
                  }
                  className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Latitude (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={-85}
                    max={85}
                    value={selectedLat}
                    onChange={(e) =>
                      onChangeRegion({
                        name: regionName,
                        lat: Number(e.target.value),
                        lon: selectedLon,
                        radiusKm,
                      })
                    }
                    className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 font-mono text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Longitude (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={-180}
                    max={180}
                    value={selectedLon}
                    onChange={(e) =>
                      onChangeRegion({
                        name: regionName,
                        lat: selectedLat,
                        lon: Number(e.target.value),
                        radiusKm,
                      })
                    }
                    className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 font-mono text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Spatial Radius</span>
                  <span className="font-mono text-cyan-400">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={radiusKm}
                  onChange={(e) =>
                    onChangeRegion({
                      name: regionName,
                      lat: selectedLat,
                      lon: selectedLon,
                      radiusKm: Number(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Optional Comparison Region */}
            <div className="border-t border-slate-800 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <GitCompare className="h-3.5 w-3.5 text-amber-400" />
                  Paired Comparison Region
                </span>
                {comparisonRegion && (
                  <button
                    type="button"
                    onClick={() => onChangeComparison(null)}
                    className="text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={comparisonRegion?.name ?? ''}
                onChange={(e) => {
                  const found = benchmarkRegions.find((b) => b.name === e.target.value);
                  if (found) {
                    onChangeComparison({
                      name: found.name,
                      lat: found.lat,
                      lon: found.lon,
                      radiusKm: found.radiusKm,
                    });
                  } else {
                    onChangeComparison(null);
                  }
                }}
                className="w-full rounded border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="">None (Single-region investigation)</option>
                {benchmarkRegions.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Predefined Scientific Benchmark Regions */}
          <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-slate-100">
              Benchmark Regions
            </h2>
            <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {benchmarkRegions.map((reg) => {
                const isSelected =
                  Math.abs(reg.lat - selectedLat) < 0.05 &&
                  Math.abs(reg.lon - selectedLon) < 0.05;
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => handleBenchmarkSelect(reg)}
                    className={`w-full text-left rounded-md border p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500/60 bg-cyan-500/10'
                        : 'border-slate-800 bg-[#07090E] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100 truncate">
                        {reg.name}
                      </span>
                      <span className="font-mono text-[11px] text-cyan-400 shrink-0">
                        {reg.lat.toFixed(1)}°, {reg.lon.toFixed(1)}°
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {reg.countryOrZone} · {reg.biome}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {reg.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Interactive Viewport */}
        <div className="lg:col-span-8">
          {viewportMode === 'globe' ? (
            <EarthGlobe3D
              selectedLat={selectedLat}
              selectedLon={selectedLon}
              regionName={regionName}
              benchmarkRegions={benchmarkRegions}
              onSelectLocation={(lat, lon, matched) => {
                if (matched) {
                  handleBenchmarkSelect(matched);
                } else {
                  onChangeRegion({
                    name: `Custom Region (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
                    lat,
                    lon,
                    radiusKm,
                  });
                }
              }}
              heightClass="h-[640px]"
            />
          ) : (
            <div className="rounded-lg border border-slate-800 bg-[#0B101B] p-4">
              <SpatialTrendMap
                centerLat={selectedLat}
                centerLon={selectedLon}
                radiusKm={radiusKm}
                mode="picker"
                heightClass="h-[570px]"
                onPickCoordinate={(lat, lon) =>
                  onChangeRegion({
                    name: `Custom Region (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
                    lat,
                    lon,
                    radiusKm,
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

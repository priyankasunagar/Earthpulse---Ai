import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { SpatialCellResult } from '../types/earthpulse';

export type SpatialMapLayer = 'direction' | 'magnitude' | 'significance' | 'coverage';

interface SpatialTrendMapProps {
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  spatialCells?: SpatialCellResult[];
  unit?: string;
  alpha?: number;
  selectedCellId?: string | null;
  onSelectCell?: (cell: SpatialCellResult) => void;
  onPickCoordinate?: (lat: number, lon: number) => void;
  heightClass?: string;
  mode?: 'picker' | 'analysis';
}

function colorForMagnitude(slope: number, maxAbs: number): string {
  const norm = Math.max(-1, Math.min(1, slope / Math.max(0.001, maxAbs)));
  if (norm >= 0) {
    // Amber -> Red-Orange for positive slope
    const r = 245;
    const g = Math.round(180 - norm * 120);
    const b = Math.round(60 - norm * 45);
    return `rgb(${r}, ${g}, ${b})`;
  }
  // Cyan -> Cobalt Blue for negative slope
  const a = Math.abs(norm);
  const r = Math.round(56 - a * 30);
  const g = Math.round(189 - a * 90);
  const b = Math.round(248 - a * 20);
  return `rgb(${r}, ${g}, ${b})`;
}

function colorForCoverage(pct: number): string {
  if (pct >= 90) return '#10b981';
  if (pct >= 70) return '#06b6d4';
  if (pct >= 50) return '#f59e0b';
  return '#f43f5e';
}

export const SpatialTrendMap: React.FC<SpatialTrendMapProps> = ({
  centerLat,
  centerLon,
  radiusKm,
  spatialCells = [],
  unit = '',
  alpha = 0.05,
  selectedCellId,
  onSelectCell,
  onPickCoordinate,
  heightClass = 'h-[420px]',
  mode = 'analysis',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark');
  const [activeLayer, setActiveLayer] = useState<SpatialMapLayer>('direction');

  const onPickRef = useRef(onPickCoordinate);
  onPickRef.current = onPickCoordinate;
  const onSelectCellRef = useRef(onSelectCell);
  onSelectCellRef.current = onSelectCell;

  // Initialize Leaflet map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [centerLat, centerLon],
      zoom: mode === 'picker' ? 6 : 8,
      zoomControl: true,
      worldCopyJump: true,
    });

    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 18,
      }
    );
    darkTiles.addTo(map);
    tileLayerRef.current = darkTiles;

    const overlays = L.layerGroup().addTo(map);
    overlayLayerRef.current = overlays;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onPickRef.current) {
        onPickRef.current(
          Number(e.latlng.lat.toFixed(4)),
          Number(e.latlng.lng.toFixed(4))
        );
      }
    });

    mapRef.current = map;

    const resizeObs = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObs.observe(el);

    return () => {
      resizeObs.disconnect();
      map.remove();
      mapRef.current = null;
      overlayLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Switch basemap tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const url =
      basemap === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const attribution =
      basemap === 'satellite'
        ? 'Tiles &copy; Esri &mdash; Earthstar Geographics'
        : '&copy; OpenStreetMap &copy; CARTO';
    const nextLayer = L.tileLayer(url, { attribution, maxZoom: 18 });
    nextLayer.addTo(map);
    tileLayerRef.current = nextLayer;
  }, [basemap]);

  // Recenter and draw overlays when coordinates, radius, cells, or activeLayer change
  useEffect(() => {
    const map = mapRef.current;
    const overlays = overlayLayerRef.current;
    if (!map || !overlays) return;

    overlays.clearLayers();

    // Draw search radius ring
    L.circle([centerLat, centerLon], {
      radius: radiusKm * 1000,
      color: '#22d3ee',
      weight: 1.5,
      dashArray: '5 5',
      fillColor: '#06b6d4',
      fillOpacity: 0.06,
    }).addTo(overlays);

    // Center marker
    L.circleMarker([centerLat, centerLon], {
      radius: 5,
      color: '#ffffff',
      weight: 1.5,
      fillColor: '#06b6d4',
      fillOpacity: 1,
    })
      .bindTooltip(
        `Region Center: ${centerLat.toFixed(3)}°, ${centerLon.toFixed(3)}°`,
        { direction: 'top' }
      )
      .addTo(overlays);

    if (spatialCells.length > 0) {
      const maxAbs = Math.max(
        0.01,
        ...spatialCells.map((c) => Math.abs(c.sensSlopePerDecade))
      );

      for (const cell of spatialCells) {
        let fillColor = '#64748b';
        if (activeLayer === 'direction') {
          fillColor =
            cell.direction === 'increasing'
              ? '#f59e0b'
              : cell.direction === 'decreasing'
              ? '#06b6d4'
              : '#475569';
        } else if (activeLayer === 'magnitude') {
          fillColor = colorForMagnitude(cell.sensSlopePerDecade, maxAbs);
        } else if (activeLayer === 'significance') {
          fillColor = cell.isSignificantFdr
            ? '#10b981'
            : cell.isSignificantRaw
            ? '#f59e0b'
            : '#334155';
        } else if (activeLayer === 'coverage') {
          fillColor = colorForCoverage(cell.coveragePct);
        }

        const isSelected = selectedCellId === cell.cellId;
        const rect = L.rectangle(cell.bounds, {
          color: isSelected ? '#ffffff' : '#0f172a',
          weight: isSelected ? 2.5 : 1,
          fillColor,
          fillOpacity: 0.58,
        });

        rect.bindTooltip(
          `<div style="font-family:monospace;font-size:11px;line-height:1.45">
            <strong>Cell ${cell.cellId}</strong> (${cell.lat.toFixed(2)}°, ${cell.lon.toFixed(2)}°)<br/>
            Sen Slope: ${cell.sensSlopePerDecade >= 0 ? '+' : ''}${cell.sensSlopePerDecade.toFixed(3)} ${unit}/dec<br/>
            p-value: ${cell.pValue.toFixed(4)} | FDR q: ${cell.fdrQValue.toFixed(4)}<br/>
            Coverage: ${cell.coveragePct.toFixed(1)}% (${cell.validObservations} obs)
          </div>`,
          { sticky: true }
        );

        rect.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectCellRef.current) {
            onSelectCellRef.current(cell);
          }
        });

        rect.addTo(overlays);
      }

      const groupBounds = L.latLngBounds(
        spatialCells.flatMap((c) => [c.bounds[0], c.bounds[1]])
      );
      map.fitBounds(groupBounds.pad(0.35), { animate: false, maxZoom: 11 });
    } else {
      const targetZoom = radiusKm > 80 ? 6 : radiusKm > 30 ? 8 : 9;
      map.setView([centerLat, centerLon], targetZoom, { animate: false });
    }
  }, [centerLat, centerLon, radiusKm, spatialCells, activeLayer, selectedCellId, unit]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {mode === 'analysis' ? (
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-800 bg-[#07090E] p-1">
            {(
              [
                { id: 'direction', label: 'Trend Direction' },
                { id: 'magnitude', label: 'Trend Magnitude' },
                { id: 'significance', label: 'FDR Significance' },
                { id: 'coverage', label: 'Data Coverage' },
              ] as const
            ).map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveLayer(layer.id)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeLayer === layer.id
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Click anywhere on the map to set custom investigation coordinates.
          </div>
        )}

        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#07090E] p-1">
          <button
            type="button"
            onClick={() => setBasemap('dark')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              basemap === 'dark'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dark Vector
          </button>
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              basemap === 'satellite'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite Imagery
          </button>
        </div>
      </div>

      {/* Leaflet Viewport */}
      <div
        ref={containerRef}
        className={`w-full overflow-hidden rounded-lg border border-slate-800 ${heightClass}`}
      />

      {/* Explicit Non-Hue-Only Legend */}
      {mode === 'analysis' && spatialCells.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
          {activeLayer === 'direction' && (
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#f59e0b]" />
                <span>Increasing (p &lt; {alpha})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#06b6d4]" />
                <span>Decreasing (p &lt; {alpha})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#475569]" />
                <span>No Significant Trend</span>
              </span>
            </div>
          )}
          {activeLayer === 'magnitude' && (
            <div className="flex items-center gap-3">
              <span>Negative Slope ({unit}/dec)</span>
              <div className="h-2.5 w-36 rounded-sm bg-gradient-to-r from-[#0ea5e9] via-[#475569] to-[#f59e0b]" />
              <span>Positive Slope ({unit}/dec)</span>
            </div>
          )}
          {activeLayer === 'significance' && (
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#10b981]" />
                <span>Significant after BH-FDR (q &lt; {alpha})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#f59e0b]" />
                <span>Significant Raw Only (p &lt; {alpha})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#334155]" />
                <span>Not Significant</span>
              </span>
            </div>
          )}
          {activeLayer === 'coverage' && (
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#10b981]" />
                <span>≥ 90% Valid</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#06b6d4]" />
                <span>70–89% Valid</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#f59e0b]" />
                <span>50–69% Valid</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#f43f5e]" />
                <span>&lt; 50% Valid</span>
              </span>
            </div>
          )}
          <span className="font-mono text-[11px] text-slate-400">
            Click any grid cell to inspect cell-level statistics
          </span>
        </div>
      )}
    </div>
  );
};

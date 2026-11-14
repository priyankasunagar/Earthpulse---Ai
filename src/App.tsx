import React, { useEffect, useState } from 'react';
import { TopNav, type AppSection } from './components/TopNav';
import { HomeView } from './views/HomeView';
import { EarthExplorerView } from './views/EarthExplorerView';
import { DataDiscoveryView } from './views/DataDiscoveryView';
import { InvestigationBuilderView } from './views/InvestigationBuilderView';
import { AnalysisLaboratoryView } from './views/AnalysisLaboratoryView';
import { ResearchReportsView } from './views/ResearchReportsView';
import { DataSourcesView } from './views/DataSourcesView';
import type {
  BenchmarkRegion,
  DatasetVariable,
  InvestigationRequest,
  InvestigationResult,
} from './types/earthpulse';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [variables, setVariables] = useState<DatasetVariable[]>([]);
  const [benchmarkRegions, setBenchmarkRegions] = useState<BenchmarkRegion[]>([]);
  const [earthdataTokenConfigured, setEarthdataTokenConfigured] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [config, setConfig] = useState<InvestigationRequest>({
    variableId: 'nasa_power_ts',
    regionName: 'Bengaluru Metropolitan Region, India',
    lat: 12.9716,
    lon: 77.5946,
    radiusKm: 35,
    comparisonRegion: {
      name: 'Kodagu Forest Reserve, Western Ghats',
      lat: 12.3375,
      lon: 75.8069,
      radiusKm: 30,
    },
    startDate: '2005-01-01',
    endDate: '2024-12-31',
    spatialAggregation: 'grid_cells',
    temporalAggregation: 'monthly',
    statisticalMethod: 'auto',
    alpha: 0.05,
    deseasonalize: true,
    gridResolution: 3,
  });

  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/discovery/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setVariables(data.variables ?? []);
        setBenchmarkRegions(data.benchmarkRegions ?? []);
        setEarthdataTokenConfigured(Boolean(data.earthdataTokenConfigured));
      })
      .catch((err) => {
        console.error('Failed to load EarthPulse catalog:', err);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const executeInvestigation = async (overrideConfig?: InvestigationRequest) => {
    const payload = overrideConfig ?? config;
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Server returned HTTP ${res.status}`);
      }
      setResult(json as InvestigationResult);
      setActiveSection('laboratory');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Investigation failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickInvestigate = (variableId: string, region: BenchmarkRegion) => {
    const nextConfig: InvestigationRequest = {
      ...config,
      variableId,
      regionName: region.name,
      lat: region.lat,
      lon: region.lon,
      radiusKm: region.radiusKm,
      comparisonRegion: null,
      startDate: variableId.startsWith('mod') ? '2012-01-01' : '2005-01-01',
      endDate: '2024-12-31',
    };
    setConfig(nextConfig);
    setActiveSection('builder');
    executeInvestigation(nextConfig);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100">
      <TopNav
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
        hasResults={Boolean(result)}
      />

      <main className="flex-1">
        {catalogLoading ? (
          <div className="mx-auto max-w-[1440px] px-6 py-20 text-center text-sm text-slate-400">
            Loading verified NASA and Earth-system dataset catalog...
          </div>
        ) : (
          <>
            {activeSection === 'home' && (
              <HomeView
                selectedLat={config.lat}
                selectedLon={config.lon}
                regionName={config.regionName}
                benchmarkRegions={benchmarkRegions}
                variablesCount={variables.length}
                onSelectLocation={(lat, lon, matched) => {
                  if (matched) {
                    setConfig((prev) => ({
                      ...prev,
                      regionName: matched.name,
                      lat: matched.lat,
                      lon: matched.lon,
                      radiusKm: matched.radiusKm,
                    }));
                  } else {
                    setConfig((prev) => ({
                      ...prev,
                      regionName: `Custom Region (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
                      lat,
                      lon,
                    }));
                  }
                }}
                onQuickInvestigate={handleQuickInvestigate}
                onNavigate={setActiveSection}
              />
            )}

            {activeSection === 'explorer' && (
              <EarthExplorerView
                selectedLat={config.lat}
                selectedLon={config.lon}
                regionName={config.regionName}
                radiusKm={config.radiusKm}
                comparisonRegion={config.comparisonRegion ?? null}
                benchmarkRegions={benchmarkRegions}
                onChangeRegion={(r) =>
                  setConfig((prev) => ({
                    ...prev,
                    regionName: r.name,
                    lat: r.lat,
                    lon: r.lon,
                    radiusKm: r.radiusKm,
                  }))
                }
                onChangeComparison={(comp) =>
                  setConfig((prev) => ({ ...prev, comparisonRegion: comp }))
                }
                onProceedToBuilder={() => setActiveSection('builder')}
              />
            )}

            {activeSection === 'discovery' && (
              <DataDiscoveryView
                variables={variables}
                selectedVariableId={config.variableId}
                onSelectForInvestigation={(variableId) => {
                  setConfig((prev) => ({ ...prev, variableId }));
                  setActiveSection('builder');
                }}
              />
            )}

            {activeSection === 'builder' && (
              <InvestigationBuilderView
                variables={variables}
                benchmarkRegions={benchmarkRegions}
                config={config}
                onChangeConfig={setConfig}
                onRunInvestigation={() => executeInvestigation()}
                isRunning={isRunning}
                errorMsg={errorMsg}
              />
            )}

            {(activeSection === 'laboratory' || activeSection === 'trends') &&
              (result ? (
                <AnalysisLaboratoryView
                  result={result}
                  activeSubTab={activeSection}
                  onSwitchTab={setActiveSection}
                />
              ) : (
                <InvestigationBuilderView
                  variables={variables}
                  benchmarkRegions={benchmarkRegions}
                  config={config}
                  onChangeConfig={setConfig}
                  onRunInvestigation={() => executeInvestigation()}
                  isRunning={isRunning}
                  errorMsg={errorMsg}
                />
              ))}

            {activeSection === 'reports' &&
              (result ? (
                <ResearchReportsView
                  result={result}
                  onBackToLab={() => setActiveSection('laboratory')}
                />
              ) : (
                <InvestigationBuilderView
                  variables={variables}
                  benchmarkRegions={benchmarkRegions}
                  config={config}
                  onChangeConfig={setConfig}
                  onRunInvestigation={() => executeInvestigation()}
                  isRunning={isRunning}
                  errorMsg={errorMsg}
                />
              ))}

            {activeSection === 'sources' && (
              <DataSourcesView
                variables={variables}
                earthdataTokenConfigured={earthdataTokenConfigured}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#07090E] px-6 py-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>EarthPulse · Earth System Trend Detective</span>
          <span>
            Data Provenance: NASA ORNL DAAC · NASA Langley POWER · NASA CMR · ECMWF ERA5
          </span>
        </div>
      </footer>
    </div>
  );
}

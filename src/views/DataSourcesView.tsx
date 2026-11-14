import React from 'react';
import { ExternalLink, Shield, Satellite } from 'lucide-react';
import type { DatasetVariable } from '../types/earthpulse';

interface DataSourcesViewProps {
  variables: DatasetVariable[];
  earthdataTokenConfigured: boolean;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({
  variables,
  earthdataTokenConfigured,
}) => {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-8">
      <div className="border-b border-slate-800 pb-4 space-y-1">
        <h1 className="font-display text-2xl font-bold text-slate-100">
          Data Sources, Satellite Provenance &amp; Calibration Standards
        </h1>
        <p className="text-sm text-slate-400">
          Authoritative documentation of Earth-observation missions, physical unit conversions, bitmask quality rules, and backend API authentication.
        </p>
      </div>

      {/* Mission Imagery Showcase */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="overflow-hidden rounded-lg border border-slate-800 bg-[#0B101B]">
          <div className="relative h-56 w-full bg-[#07090E]">
            <img
              src="/src/assets/images/terra_modis_satellite_1794592683703.jpg"
              alt="NASA Terra MODIS Earth observation spacecraft above continental terrain"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B101B] via-transparent to-transparent" />
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Satellite className="h-3.5 w-3.5" />
              <span>NASA Terra &amp; Aqua · MODIS Collection 6.1</span>
            </div>
            <h2 className="font-display text-lg font-semibold text-slate-100">
              MOD11A2.061, MOD13A2.061 &amp; MOD17A2H.061
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Accessed directly via NASA ORNL DAAC MODIS Global Subset REST API and verified
              against NASA Earthdata Common Metadata Repository (CMR). Digital numbers are
              decoded with exact mission scale factors (0.02 K/DN for LST, 0.0001 for NDVI/EVI/GPP)
              and filtered via 8-bit QC bitmasks.
            </p>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-slate-800 bg-[#0B101B]">
          <div className="relative h-56 w-full bg-[#07090E]">
            <img
              src="/src/assets/images/gpm_precipitation_satellite_1794592683828.jpg"
              alt="Precipitation radar and microwave satellite scanning oceanic storm system"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B101B] via-transparent to-transparent" />
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Satellite className="h-3.5 w-3.5" />
              <span>NASA Langley POWER · GPM IMERG / MERRA-2 / CERES / ERA5</span>
            </div>
            <h2 className="font-display text-lg font-semibold text-slate-100">
              Global Hydrological, Radiative &amp; Atmospheric Reanalysis
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Multi-decadal daily and monthly gridded observations retrieved in real time from NASA
              Langley POWER (MERRA-2, CERES SYN1deg, GPM-corrected precipitation) and Copernicus
              ECMWF ERA5 Historical Archive, cleanly separating radiative skin temperature from 2m
              shelter air temperature.
            </p>
          </div>
        </article>
      </section>

      {/* Backend Credential Transparency */}
      <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-display text-sm font-semibold text-slate-100">
              Backend Authentication &amp; Environment Security
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Public NASA ORNL DAAC MODIS, NASA POWER, NASA CMR, and Copernicus ERA5 APIs operate
              without exposing client-side keys. Optional protected NASA Earthdata Bearer requests
              read <code className="font-mono text-cyan-400">EARTHDATA_TOKEN</code> strictly on
              the backend server.
            </p>
          </div>
        </div>
        <span className="font-mono text-xs text-slate-300">
          EARTHDATA_TOKEN: {earthdataTokenConfigured ? 'Configured on server' : 'Public endpoints active'}
        </span>
      </section>

      {/* Full Dataset Provenance Registry Table */}
      <section className="rounded-lg border border-slate-800 bg-[#0B101B] p-5 space-y-4">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          Verified Dataset &amp; Calibration Registry
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 pr-3">Dataset ID</th>
                <th className="py-2.5 px-3">Variable &amp; Band</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Scale / Offset</th>
                <th className="py-2.5 px-3">Valid Range</th>
                <th className="py-2.5 px-3">DOI</th>
                <th className="py-2.5 pl-3 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {variables.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3 font-mono text-cyan-400 whitespace-nowrap">
                    {v.datasetId}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-100">{v.variableName}</div>
                    <div className="font-mono text-[11px] text-slate-400">{v.providerBand}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-200 whitespace-nowrap">
                    {v.unit}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                    ×{v.scaleFactor} + ({v.addOffset})
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                    [{v.validRange[0]}, {v.validRange[1]}]
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {v.doi}
                  </td>
                  <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                    <a
                      href={v.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    >
                      <span>Docs</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

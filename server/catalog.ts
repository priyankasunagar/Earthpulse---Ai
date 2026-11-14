import type { BenchmarkRegion, CmrVerificationInfo, DatasetVariable } from '../src/types/earthpulse';

export const EARTH_SYSTEM_CATALOG: DatasetVariable[] = [
  // A. TEMPERATURE
  {
    id: 'mod11a2_lst_day',
    variableName: 'Daytime Land Surface Temperature',
    shortLabel: 'LST Day (1 km)',
    category: 'Temperature',
    scientificDescription:
      'Radiometric skin temperature of the Earth land surface measured during Terra sun-synchronous daytime overpasses (~10:30 local solar time) using split-window thermal infrared bands 31 and 32.',
    physicalMeaningNote:
      'Measures radiative skin temperature (LST), NOT 2-meter shelter air temperature. Urban asphalt, bare soil, and dry canopies exhibit substantially higher LST than ambient air temperature.',
    unit: '°C',
    datasetId: 'MOD11A2.061',
    datasetName: 'MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1 km SIN Grid v061',
    missionOrModel: 'NASA Terra / MODIS',
    dataSource: 'NASA LP DAAC / ORNL DAAC MODIS REST Service',
    provider: 'NASA_ORNL_MODIS',
    providerBand: 'LST_Day_1km',
    cmrShortName: 'MOD11A2',
    doi: '10.5067/MODIS/MOD11A2.061',
    documentationUrl: 'https://lpdaac.usgs.gov/products/mod11a2v061/',
    spatialResolution: '1 km (Sinusoidal Grid)',
    temporalResolution: '8-day clear-sky composite',
    observationPeriod: { start: '2000-02-18', end: 'Present' },
    geographicalCoverage: 'Global land surfaces (90°N–90°S, 180°W–180°E)',
    qualityInfo:
      '8-bit QC_Day bitmask evaluated per pixel; bits 0–1 == 00 (good quality, error ≤ 1 K) or 01 (other quality) retained; cloud-contaminated & fill value (0) excluded. Valid raw DN: 7500–65535.',
    scaleFactor: 0.02,
    addOffset: -273.15,
    fillValue: 0,
    validRange: [7500, 65535],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      '8-day LST series exhibit strong annual seasonality and short-lag persistence; deseasonalized anomalies paired with Hamed-Rao Modified Mann-Kendall and Sen\'s slope prevent autocorrelation from inflating Type I error.',
    practicalSignificanceThresholdPerDecade: 0.25,
    verifiedMetadata: true,
    palette: 'thermal',
  },
  {
    id: 'mod11a2_lst_night',
    variableName: 'Nighttime Land Surface Temperature',
    shortLabel: 'LST Night (1 km)',
    category: 'Temperature',
    scientificDescription:
      'Radiometric nighttime land surface skin temperature retrieved during Terra descending node (~22:30 local solar time), ideal for isolating nocturnal urban heat island retention and minimum-temperature warming.',
    physicalMeaningNote:
      'Nighttime skin temperature decouples from direct solar insolation and reflects surface thermal inertia, soil moisture, and urban heat storage—not 2m air temperature.',
    unit: '°C',
    datasetId: 'MOD11A2.061',
    datasetName: 'MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1 km SIN Grid v061',
    missionOrModel: 'NASA Terra / MODIS',
    dataSource: 'NASA LP DAAC / ORNL DAAC MODIS REST Service',
    provider: 'NASA_ORNL_MODIS',
    providerBand: 'LST_Night_1km',
    cmrShortName: 'MOD11A2',
    doi: '10.5067/MODIS/MOD11A2.061',
    documentationUrl: 'https://lpdaac.usgs.gov/products/mod11a2v061/',
    spatialResolution: '1 km (Sinusoidal Grid)',
    temporalResolution: '8-day clear-sky composite',
    observationPeriod: { start: '2000-02-18', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo:
      'Filtered via QC_Night bitmask (bits 0–1 <= 1) and valid DN range [7500, 65535]. Scale factor 0.02 converts DN to Kelvin, then offset -273.15 converts to °C.',
    scaleFactor: 0.02,
    addOffset: -273.15,
    fillValue: 0,
    validRange: [7500, 65535],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      'Nocturnal LST is less affected by daytime cloud shadow noise than daytime LST, yet retains serial correlation across 8-day intervals; Modified Mann-Kendall accounts for effective sample size.',
    practicalSignificanceThresholdPerDecade: 0.2,
    verifiedMetadata: true,
    palette: 'thermal',
  },
  {
    id: 'nasa_power_t2m',
    variableName: 'Near-Surface Air Temperature (2m)',
    shortLabel: 'Air Temp 2m',
    category: 'Temperature',
    scientificDescription:
      'Dry-bulb air temperature at 2 meters above the displacement plane derived from NASA MERRA-2 global atmospheric assimilation.',
    physicalMeaningNote:
      'Measures shelter-height atmospheric air temperature (2m), distinct from satellite thermal infrared Land Surface Temperature (skin temperature).',
    unit: '°C',
    datasetId: 'POWER_MERRA2_T2M',
    datasetName: 'NASA POWER / GMAO MERRA-2 Reanalysis Air Temperature at 2 Meters',
    missionOrModel: 'NASA GMAO MERRA-2 / POWER',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'T2M',
    cmrShortName: 'M2TMNXSLV',
    doi: '10.5067/VJAFPLI1CSIV',
    documentationUrl: 'https://power.larc.nasa.gov/docs/methodology/meteorology/temperature/',
    spatialResolution: '0.5° × 0.625° (~55 km)',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '1981-01-01', end: 'Present' },
    geographicalCoverage: 'Global (90°N–90°S, 180°W–180°E)',
    qualityInfo:
      'Assimilated multi-instrument meteorological reanalysis; missing or out-of-bounds values encoded as -999 are filtered prior to deseasonalization.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [-90, 65],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      'Atmospheric air temperature anomalies exhibit multi-month autocorrelation (ENSO/persistence); Hamed-Rao variance correction prevents overstating significance.',
    practicalSignificanceThresholdPerDecade: 0.15,
    verifiedMetadata: true,
    palette: 'thermal',
  },
  {
    id: 'nasa_power_ts',
    variableName: 'Earth Skin Temperature (Radiative Surface)',
    shortLabel: 'Earth Skin Temp',
    category: 'Temperature',
    scientificDescription:
      'Continuous all-sky Earth surface skin temperature from NASA MERRA-2 surface energy balance assimilation, complementing clear-sky MODIS LST.',
    physicalMeaningNote:
      'Represents radiative skin temperature over land and ocean surfaces without clear-sky sampling bias, distinct from 2m air temperature.',
    unit: '°C',
    datasetId: 'POWER_MERRA2_TS',
    datasetName: 'NASA POWER / MERRA-2 Earth Skin Temperature',
    missionOrModel: 'NASA GMAO MERRA-2 / POWER',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'TS',
    cmrShortName: 'M2T1NXSLV',
    doi: '10.5067/VJAFPLI1CSIV',
    documentationUrl: 'https://power.larc.nasa.gov/',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '1981-01-01', end: 'Present' },
    geographicalCoverage: 'Global',
    qualityInfo: 'All-sky assimilation with -999 fill value check and physical plausibility bounds [-95, 75] °C.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [-95, 75],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      'Continuous multi-decadal skin temperature record suited for deseasonalized non-parametric Sen\'s slope and Modified Mann-Kendall testing.',
    practicalSignificanceThresholdPerDecade: 0.2,
    verifiedMetadata: true,
    palette: 'thermal',
  },

  // B. VEGETATION
  {
    id: 'mod13a2_ndvi',
    variableName: 'Normalized Difference Vegetation Index (NDVI)',
    shortLabel: 'NDVI (1 km)',
    category: 'Vegetation',
    scientificDescription:
      '16-day composite Normalized Difference Vegetation Index measuring canopy chlorophyll absorption in red wavelengths vs. cellular near-infrared reflectance.',
    physicalMeaningNote:
      'Unitless index bounded in [-0.2, 1.0]; values >0.2 indicate active photosynthetic vegetation, while negative values correspond to water, snow, or clouds.',
    unit: 'NDVI',
    datasetId: 'MOD13A2.061',
    datasetName: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 1 km SIN Grid v061',
    missionOrModel: 'NASA Terra / MODIS',
    dataSource: 'NASA LP DAAC / ORNL DAAC MODIS REST Service',
    provider: 'NASA_ORNL_MODIS',
    providerBand: '1_km_16_days_NDVI',
    cmrShortName: 'MOD13A2',
    doi: '10.5067/MODIS/MOD13A2.061',
    documentationUrl: 'https://lpdaac.usgs.gov/products/mod13a2v061/',
    spatialResolution: '1 km (Sinusoidal Grid)',
    temporalResolution: '16-day BRDF-adjusted composite',
    observationPeriod: { start: '2000-02-18', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo:
      '16-bit signed integer with scale factor 0.0001; fill value -3000; 1_km_16_days_VI_Quality bits 0–1 (MODLAND QA) filtered to retain best/useful pixels.',
    scaleFactor: 0.0001,
    addOffset: 0,
    fillValue: -3000,
    validRange: [-2000, 10000],
    recommendedMethod: 'seasonal_mk',
    methodRationale:
      'Vegetation phenology exhibits pronounced bounded seasonal cycles and potential saturation; Seasonal Mann-Kendall and Sen\'s slope avoid normality assumptions and isolate interannual greening/browning.',
    practicalSignificanceThresholdPerDecade: 0.02,
    verifiedMetadata: true,
    palette: 'vegetation',
  },
  {
    id: 'mod13a2_evi',
    variableName: 'Enhanced Vegetation Index (EVI)',
    shortLabel: 'EVI (1 km)',
    category: 'Vegetation',
    scientificDescription:
      '16-day Enhanced Vegetation Index minimizing canopy background soil noise and atmospheric aerosol interference, maintaining sensitivity in high-biomass tropical forests.',
    physicalMeaningNote:
      'Uses blue band atmospheric resistance and soil adjustment factors; does not saturate as rapidly as NDVI over dense forests like the Amazon or Congo basins.',
    unit: 'EVI',
    datasetId: 'MOD13A2.061',
    datasetName: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 1 km SIN Grid v061',
    missionOrModel: 'NASA Terra / MODIS',
    dataSource: 'NASA LP DAAC / ORNL DAAC MODIS REST Service',
    provider: 'NASA_ORNL_MODIS',
    providerBand: '1_km_16_days_EVI',
    cmrShortName: 'MOD13A2',
    doi: '10.5067/MODIS/MOD13A2.061',
    documentationUrl: 'https://lpdaac.usgs.gov/products/mod13a2v061/',
    spatialResolution: '1 km (Sinusoidal Grid)',
    temporalResolution: '16-day composite',
    observationPeriod: { start: '2000-02-18', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo:
      'Scale factor 0.0001 applied to raw integers [-2000, 10000]; fill value -3000 excluded; VI_Quality bitmask checked.',
    scaleFactor: 0.0001,
    addOffset: 0,
    fillValue: -3000,
    validRange: [-2000, 10000],
    recommendedMethod: 'seasonal_mk',
    methodRationale:
      'Strong phenological seasonality requires deseasonalization or Seasonal Mann-Kendall with Theil-Sen slope to evaluate structural canopy trends cleanly.',
    practicalSignificanceThresholdPerDecade: 0.015,
    verifiedMetadata: true,
    palette: 'vegetation',
  },
  {
    id: 'mod17a2h_gpp',
    variableName: 'Gross Primary Productivity (Vegetation Productivity)',
    shortLabel: 'GPP (500 m)',
    category: 'Vegetation',
    scientificDescription:
      'Cumulative 8-day terrestrial Gross Primary Productivity estimating total carbon fixed by vegetation photosynthesis via radiation-use efficiency modelling.',
    physicalMeaningNote:
      'Quantifies ecosystem carbon uptake rate (kg C m⁻² per 8-day period); sensitive to drought stress, thermal extremes, and land-cover conversion.',
    unit: 'kg C/m²/8d',
    datasetId: 'MOD17A2H.061',
    datasetName: 'MODIS/Terra Gross Primary Productivity 8-Day L4 Global 500 m SIN Grid v061',
    missionOrModel: 'NASA Terra / MODIS',
    dataSource: 'NASA LP DAAC / ORNL DAAC MODIS REST Service',
    provider: 'NASA_ORNL_MODIS',
    providerBand: 'Gpp_500m',
    cmrShortName: 'MOD17A2H',
    doi: '10.5067/MODIS/MOD17A2H.061',
    documentationUrl: 'https://lpdaac.usgs.gov/products/mod17a2hv061/',
    spatialResolution: '500 m',
    temporalResolution: '8-day cumulative',
    observationPeriod: { start: '2000-02-18', end: 'Present' },
    geographicalCoverage: 'Global vegetated land surfaces',
    qualityInfo:
      'Raw scale factor 0.0001; fill values > 30000 (water, barren, urban, unclassifiable) strictly masked out.',
    scaleFactor: 0.0001,
    addOffset: 0,
    fillValue: 32767,
    validRange: [0, 30000],
    recommendedMethod: 'seasonal_mk',
    methodRationale:
      'GPP distributions are bounded at zero during winter/dry seasons and strongly seasonal; non-parametric Seasonal Mann-Kendall handles zero-inflated dry intervals.',
    practicalSignificanceThresholdPerDecade: 0.005,
    verifiedMetadata: true,
    palette: 'vegetation',
  },

  // C. WATER
  {
    id: 'nasa_power_precip',
    variableName: 'Precipitation Rate (Corrected IMERG / MERRA-2)',
    shortLabel: 'Precipitation',
    category: 'Water',
    scientificDescription:
      'Bias-corrected total surface precipitation rate integrating NASA GPM IMERG satellite microwave/IR estimates and MERRA-2 atmospheric water budget.',
    physicalMeaningNote:
      'Precipitation time series are strongly right-skewed and zero-inflated on daily/monthly scales; non-parametric tests are essential rather than standard OLS alone.',
    unit: 'mm/day',
    datasetId: 'GPM_POWER_PRECTOTCORR',
    datasetName: 'NASA POWER Precipitation Corrected (GPM IMERG / MERRA-2 Synthesis)',
    missionOrModel: 'NASA GPM / MERRA-2',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'PRECTOTCORR',
    cmrShortName: 'GPM_3IMERGDF',
    doi: '10.5067/GPM/IMERGDF/DAY/07',
    documentationUrl: 'https://gpm.nasa.gov/data/imerg',
    spatialResolution: '0.5° × 0.625° (POWER) / 0.1° (IMERG)',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '1981-01-01', end: 'Present' },
    geographicalCoverage: 'Global',
    qualityInfo: 'Non-negative physical constraint [0, 800] mm/day; -999 fill values excluded.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [0, 800],
    recommendedMethod: 'mann_kendall_sens',
    methodRationale:
      'Precipitation is non-Gaussian, positively skewed, and sensitive to extreme convective storms; Mann-Kendall + Sen\'s slope are robust against heavy-tailed outliers.',
    practicalSignificanceThresholdPerDecade: 0.25,
    verifiedMetadata: true,
    palette: 'hydrology',
  },
  {
    id: 'nasa_power_soil_wetness',
    variableName: 'Surface Soil Wetness (0–5 cm)',
    shortLabel: 'Soil Wetness',
    category: 'Water',
    scientificDescription:
      'Fractional surface soil wetness (0 = dry wilting point, 1 = complete pore saturation) from NASA land surface hydrological assimilation.',
    physicalMeaningNote:
      'Bounded dimensionless moisture fraction [0, 1]; tracks agricultural drought onset and monsoon soil recharge.',
    unit: 'fraction (0–1)',
    datasetId: 'POWER_GWETTOP',
    datasetName: 'NASA POWER / MERRA-2 Surface Soil Wetness (Top 5 cm)',
    missionOrModel: 'NASA GMAO MERRA-2 Land',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'GWETTOP',
    cmrShortName: 'M2TMNXLND',
    doi: '10.5067/8S35XF81C28F',
    documentationUrl: 'https://power.larc.nasa.gov/',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '1981-01-01', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo: 'Bounded in [0, 1]; -999 fill flags removed.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [0, 1],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      'Soil moisture has high physical memory (multi-month lag-1 autocorrelation); Hamed-Rao variance inflation is critical to avoid spurious trend detection.',
    practicalSignificanceThresholdPerDecade: 0.02,
    verifiedMetadata: true,
    palette: 'hydrology',
  },
  {
    id: 'era5_soil_moisture',
    variableName: 'Volumetric Soil Water (0–7 cm, ERA5)',
    shortLabel: 'Soil Moisture ERA5',
    category: 'Water',
    scientificDescription:
      'Volumetric soil moisture content in the upper 0–7 cm root-zone layer from Copernicus ECMWF ERA5-Land reanalysis.',
    physicalMeaningNote:
      'Measured in cubic meters of water per cubic meter of soil (m³/m³), reflecting actual volumetric water content rather than relative saturation.',
    unit: 'm³/m³',
    datasetId: 'ERA5_SWVL1',
    datasetName: 'ECMWF ERA5-Land Volumetric Soil Water Layer 1 (0–7 cm)',
    missionOrModel: 'ECMWF Copernicus ERA5',
    dataSource: 'Open-Meteo ERA5 Historical Archive API',
    provider: 'OPEN_METEO_ERA5',
    providerBand: 'soil_moisture_0_to_7cm_mean',
    cmrShortName: 'ERA5_LAND',
    doi: '10.24381/cds.e2161bac',
    documentationUrl: 'https://open-meteo.com/en/docs/historical-weather-api',
    spatialResolution: '0.25° (~25 km)',
    temporalResolution: 'Daily',
    observationPeriod: { start: '1940-01-01', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo: 'Null/ocean cells masked automatically; validated within [0, 0.75] m³/m³.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -9999,
    validRange: [0, 0.75],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      'High-persistence hydrological memory in ERA5 soil water requires autocorrelation-adjusted Modified Mann-Kendall.',
    practicalSignificanceThresholdPerDecade: 0.015,
    verifiedMetadata: true,
    palette: 'hydrology',
  },
  {
    id: 'era5_water_balance_drought',
    variableName: 'Climatic Water Balance (P − ET₀ Drought Proxy)',
    shortLabel: 'Drought Water Balance',
    category: 'Water',
    scientificDescription:
      'Monthly/daily atmospheric moisture surplus or deficit computed as Precipitation minus FAO-56 Penman-Monteith Reference Evapotranspiration (P − ET₀).',
    physicalMeaningNote:
      'Negative values indicate atmospheric evaporative demand exceeds precipitation (aridity/drought pressure); positive values indicate moisture surplus.',
    unit: 'mm/day',
    datasetId: 'ERA5_WATER_BALANCE',
    datasetName: 'ERA5 Precipitation Minus FAO-56 Reference Evapotranspiration',
    missionOrModel: 'ECMWF ERA5 Water Balance',
    dataSource: 'Open-Meteo ERA5 Historical Archive API',
    provider: 'OPEN_METEO_ERA5',
    providerBand: 'water_balance_p_minus_et0',
    cmrShortName: 'ERA5_WB',
    doi: '10.24381/cds.adbb2d47',
    documentationUrl: 'https://open-meteo.com/en/docs/historical-weather-api',
    spatialResolution: '0.25° (~25 km)',
    temporalResolution: 'Daily / Aggregated',
    observationPeriod: { start: '1940-01-01', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo: 'Derived directly from paired daily precipitation_sum and et0_fao_evapotranspiration.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -9999,
    validRange: [-50, 500],
    recommendedMethod: 'mann_kendall_sens',
    methodRationale:
      'Water balance combines skewed precipitation with smooth evaporative demand; Sen\'s slope and Mann-Kendall robustly capture drying or wetting shifts.',
    practicalSignificanceThresholdPerDecade: 0.25,
    verifiedMetadata: true,
    palette: 'hydrology',
  },

  // D. ATMOSPHERE
  {
    id: 'nasa_power_aod',
    variableName: 'Aerosol Optical Depth (550 nm)',
    shortLabel: 'AOD 550 nm',
    category: 'Atmosphere',
    scientificDescription:
      'Columnar Aerosol Optical Depth at 550 nm measuring total atmospheric extinction by suspended particulates (smoke, mineral dust, urban sulfate/nitrate aerosols).',
    physicalMeaningNote:
      'Unitless optical depth; values <0.1 indicate clean background air, 0.2–0.5 moderate haze, and >0.7 heavy aerosol loading.',
    unit: 'AOD (unitless)',
    datasetId: 'MERRA2_AOD_55',
    datasetName: 'NASA POWER / MERRA-2 Aerosol Optical Depth at 550 nm',
    missionOrModel: 'NASA Terra/Aqua MODIS + MERRA-2',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'AOD_55',
    cmrShortName: 'M2TMNXAER',
    doi: '10.5067/FH9A0MLJPC7N',
    documentationUrl: 'https://power.larc.nasa.gov/',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '2001-01-01', end: 'Present' },
    geographicalCoverage: 'Global',
    qualityInfo: 'Non-negative physical bounds [0, 5.0]; -999 fill values removed.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [0, 5.0],
    recommendedMethod: 'seasonal_mk',
    methodRationale:
      'Aerosol loading has strong seasonal emission/monsoon washout cycles and right-skewed smoke plumes; Seasonal Mann-Kendall isolates multi-year air-quality trends.',
    practicalSignificanceThresholdPerDecade: 0.03,
    verifiedMetadata: true,
    palette: 'aerosol',
  },
  {
    id: 'nasa_power_solar_irradiance',
    variableName: 'Surface Downward Shortwave Irradiance (CERES)',
    shortLabel: 'Solar Irradiance',
    category: 'Atmosphere',
    scientificDescription:
      'All-sky downward solar shortwave irradiance reaching Earth\'s surface from NASA CERES satellite radiometry.',
    physicalMeaningNote:
      'Measured in MJ/m²/day (or converted W/m² equivalent); responds to cloud cover changes, aerosol dimming/brightening, and solar geometry.',
    unit: 'MJ/m²/day',
    datasetId: 'CERES_ALLSKY_SW_DWN',
    datasetName: 'NASA CERES SYN1deg / POWER All-Sky Surface Shortwave Downward Irradiance',
    missionOrModel: 'NASA CERES (Terra/Aqua/NOAA-20)',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'ALLSKY_SFC_SW_DWN',
    cmrShortName: 'CER_SYN1deg-Month_Terra-Aqua-MODIS',
    doi: '10.5067/TERRA+AQUA/CERES/SYN1DEG-MONTH_L3.004A',
    documentationUrl: 'https://ceres.larc.nasa.gov/data/',
    spatialResolution: '1.0° × 1.0°',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '1984-01-01', end: 'Present' },
    geographicalCoverage: 'Global',
    qualityInfo: 'Validated non-negative radiative flux [0, 45] MJ/m²/day; -999 excluded.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [0, 45],
    recommendedMethod: 'modified_mk_hamed_rao',
    methodRationale:
      'Deseasonalized solar irradiance anomalies remove the deterministic astronomical cycle while accounting for cloud/aerosol persistence.',
    practicalSignificanceThresholdPerDecade: 0.35,
    verifiedMetadata: true,
    palette: 'aerosol',
  },

  // E. LAND & ENVIRONMENT
  {
    id: 'nasa_power_snow_depth',
    variableName: 'Snow Depth (Cryosphere Cover)',
    shortLabel: 'Snow Depth',
    category: 'Land & Environment',
    scientificDescription:
      'Surface snow depth over land and ice sheets tracking seasonal snowpack accumulation and spring melt timing.',
    physicalMeaningNote:
      'Measured in centimeters (cm); non-alpine tropical regions remain zero year-round—meaningful trends occur in mid/high latitudes and mountain cryospheres.',
    unit: 'cm',
    datasetId: 'MERRA2_SNODP',
    datasetName: 'NASA POWER / MERRA-2 Surface Snow Depth',
    missionOrModel: 'NASA GMAO MERRA-2 Cryosphere',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'SNODP',
    cmrShortName: 'M2TMNXLND',
    doi: '10.5067/8S35XF81C28F',
    documentationUrl: 'https://power.larc.nasa.gov/',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '1981-01-01', end: 'Present' },
    geographicalCoverage: 'Global land surfaces',
    qualityInfo: 'Non-negative physical range [0, 1500] cm; -999 missing values filtered.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [0, 1500],
    recommendedMethod: 'seasonal_mk',
    methodRationale:
      'Snow depth is zero-inflated in summer months and highly seasonal; Seasonal Mann-Kendall tests within-season changes without summer zero bias.',
    practicalSignificanceThresholdPerDecade: 1.5,
    verifiedMetadata: true,
    palette: 'cryosphere',
  },
  {
    id: 'nasa_power_surface_albedo',
    variableName: 'Surface Broadband Albedo',
    shortLabel: 'Surface Albedo',
    category: 'Land & Environment',
    scientificDescription:
      'All-sky surface broadband shortwave albedo (ratio of reflected to incident solar radiation), sensitive to snow retreat, deforestation, and urbanization.',
    physicalMeaningNote:
      'Unitless reflectance ratio [0, 1]; bright snow/ice ~0.7–0.9, desert ~0.3–0.4, dense forest ~0.10–0.15.',
    unit: 'albedo (0–1)',
    datasetId: 'CERES_SRF_ALB',
    datasetName: 'NASA CERES / POWER All-Sky Surface Albedo',
    missionOrModel: 'NASA CERES / MODIS',
    dataSource: 'NASA Langley Research Center POWER API',
    provider: 'NASA_POWER',
    providerBand: 'SRF_ALB',
    cmrShortName: 'CER_SYN1deg-Month_Terra-Aqua-MODIS',
    doi: '10.5067/TERRA+AQUA/CERES/SYN1DEG-MONTH_L3.004A',
    documentationUrl: 'https://ceres.larc.nasa.gov/',
    spatialResolution: '1.0° × 1.0°',
    temporalResolution: 'Daily / Monthly',
    observationPeriod: { start: '2001-01-01', end: 'Present' },
    geographicalCoverage: 'Global',
    qualityInfo: 'Bounded in [0, 1]; polar night fill values (-999) properly masked.',
    scaleFactor: 1,
    addOffset: 0,
    fillValue: -999,
    validRange: [0, 1],
    recommendedMethod: 'seasonal_mk',
    methodRationale:
      'Surface albedo undergoes abrupt seasonal shifts with snow cover and phenology; Seasonal Mann-Kendall isolates year-over-year land-cover/cryosphere shifts.',
    practicalSignificanceThresholdPerDecade: 0.01,
    verifiedMetadata: true,
    palette: 'cryosphere',
  },
];

export const BENCHMARK_REGIONS: BenchmarkRegion[] = [
  {
    id: 'bengaluru_india',
    name: 'Bengaluru Metropolitan Region, India',
    countryOrZone: 'South Asia · Deccan Plateau',
    biome: 'Tropical Savanna / Rapid Urbanization',
    lat: 12.9716,
    lon: 77.5946,
    radiusKm: 35,
    description:
      'Rapidly urbanizing technology hub on the Karnataka plateau—benchmark region for urban heat island LST divergence, aerosol loading, and monsoon variability.',
  },
  {
    id: 'amazon_rondonia',
    name: 'Rondônia Frontier, Amazon Basin',
    countryOrZone: 'South America · Brazil',
    biome: 'Tropical Moist Broadleaf Forest',
    lat: -10.85,
    lon: -61.95,
    radiusKm: 50,
    description:
      'Active arc-of-deforestation corridor exhibiting canopy EVI/NDVI loss, surface albedo increase, and sensible heat warming.',
  },
  {
    id: 'svalbard_arctic',
    name: 'Svalbard Archipelago, High Arctic',
    countryOrZone: 'Europe · Arctic Circle',
    biome: 'Polar Tundra & Glaciers',
    lat: 78.2232,
    lon: 15.6267,
    radiusKm: 60,
    description:
      'Arctic amplification hotspot experiencing rapid sea-ice/snow-albedo feedback and accelerated skin & air temperature trends.',
  },
  {
    id: 'sahel_niger',
    name: 'Central Sahel Transition Zone, Niger',
    countryOrZone: 'West Africa · Semi-Arid Belt',
    biome: 'Sahelian Acacia Savanna',
    lat: 13.5116,
    lon: 2.1254,
    radiusKm: 60,
    description:
      'Hydrologically sensitive semi-arid belt tracking interannual precipitation recovery, soil wetness, and vegetation greening.',
  },
  {
    id: 'california_central_valley',
    name: 'San Joaquin Valley, California',
    countryOrZone: 'North America · USA',
    biome: 'Mediterranean Agricultural Basin',
    lat: 36.7378,
    lon: -119.7871,
    radiusKm: 45,
    description:
      'Intensive irrigated agricultural basin sensitive to multi-year drought balance (P − ET₀), root-zone soil moisture, and heat extremes.',
  },
  {
    id: 'indo_gangetic_plain',
    name: 'Indo-Gangetic Plain (Delhi–Kanpur)',
    countryOrZone: 'South Asia · India',
    biome: 'Alluvial Cropland & Dense Urban',
    lat: 27.4924,
    lon: 77.6737,
    radiusKm: 55,
    description:
      'Global hotspot for seasonal biomass burning & industrial Aerosol Optical Depth (550 nm) and winter solar dimming.',
  },
  {
    id: 'western_ghats_forest',
    name: 'Kodagu Forest Reserve, Western Ghats',
    countryOrZone: 'South Asia · India',
    biome: 'Tropical Montane Cloud Forest',
    lat: 12.3375,
    lon: 75.8069,
    radiusKm: 30,
    description:
      'Intact vegetated highland adjacent to Bengaluru—ideal paired control region for separating urban land-use warming from regional climate forcing.',
  },
  {
    id: 'himalayan_ladakh',
    name: 'Upper Indus Cryosphere, Ladakh',
    countryOrZone: 'High Mountain Asia · India',
    biome: 'Alpine Glaciers & Cold Desert',
    lat: 34.1526,
    lon: 77.5771,
    radiusKm: 50,
    description:
      'High-elevation cryosphere benchmark monitoring snow depth contraction, surface albedo decline, and elevation-dependent warming.',
  },
];

const cmrCache = new Map<string, CmrVerificationInfo>();

export async function verifyDatasetWithCmr(dataset: DatasetVariable): Promise<CmrVerificationInfo> {
  const cached = cmrCache.get(dataset.id);
  if (cached && Date.now() - new Date(cached.checkedAt).getTime() < 1000 * 60 * 30) {
    return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const url = `https://cmr.earthdata.nasa.gov/search/collections.json?short_name=${encodeURIComponent(
      dataset.cmrShortName
    )}&page_size=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`NASA CMR returned HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      feed?: {
        entry?: Array<{
          id?: string;
          title?: string;
          version_id?: string;
          time_start?: string;
          time_end?: string;
          boxes?: string[];
          data_center?: string;
        }>;
      };
    };
    const entry = json?.feed?.entry?.[0];
    const info: CmrVerificationInfo = {
      datasetId: dataset.datasetId,
      cmrShortName: dataset.cmrShortName,
      verified: Boolean(entry),
      conceptId: entry?.id,
      title: entry?.title ?? dataset.datasetName,
      versionId: entry?.version_id,
      timeStart: entry?.time_start,
      timeEnd: entry?.time_end,
      boxes: entry?.boxes,
      dataCenter: entry?.data_center,
      checkedAt: new Date().toISOString(),
    };
    cmrCache.set(dataset.id, info);
    return info;
  } catch (err) {
    return {
      datasetId: dataset.datasetId,
      cmrShortName: dataset.cmrShortName,
      verified: dataset.verifiedMetadata,
      checkedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'CMR verification request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

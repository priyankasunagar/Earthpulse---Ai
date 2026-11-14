import React, { useEffect, useRef } from 'react';
import Plotly, { type Data, type Layout, type Config } from 'plotly.js-dist-min';

interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
  height?: number;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout,
  config,
  className = '',
  height = 340,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mergedLayout: Partial<Layout> = {
      paper_bgcolor: 'rgba(11, 16, 27, 0)',
      plot_bgcolor: 'rgba(7, 9, 14, 0.55)',
      font: {
        family: 'IBM Plex Sans, sans-serif',
        color: '#cbd5e1',
        size: 12,
      },
      margin: { t: 28, r: 20, b: 48, l: 58 },
      height,
      xaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { family: 'IBM Plex Mono, monospace', size: 11, color: '#94a3b8' },
        ...layout?.xaxis,
      },
      yaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { family: 'IBM Plex Mono, monospace', size: 11, color: '#94a3b8' },
        ...layout?.yaxis,
      },
      legend: {
        orientation: 'h',
        y: 1.12,
        x: 0,
        font: { size: 11, color: '#cbd5e1' },
        bgcolor: 'rgba(0,0,0,0)',
        ...layout?.legend,
      },
      hoverlabel: {
        bgcolor: '#0b101b',
        bordercolor: '#334155',
        font: { family: 'IBM Plex Mono, monospace', size: 11, color: '#f8fafc' },
      },
      ...layout,
    };

    const mergedConfig: Partial<Config> = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
      ...config,
    };

    Plotly.react(el, data, mergedLayout, mergedConfig);

    const resizeObs = new ResizeObserver(() => {
      if (el) {
        Plotly.Plots.resize(el);
      }
    });
    resizeObs.observe(el);

    return () => {
      resizeObs.disconnect();
    };
  }, [data, layout, config, height]);

  useEffect(() => {
    const el = containerRef.current;
    return () => {
      if (el) {
        Plotly.purge(el);
      }
    };
  }, []);

  return <div ref={containerRef} className={`w-full ${className}`} />;
};

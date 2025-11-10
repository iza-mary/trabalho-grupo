import { useMemo } from 'react';

function buildPath(values, width, height, padding = 8) {
  if (!values || values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  const toY = (v) => height - padding - ((v - min) / range) * (height - padding * 2);

  return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padding + i * stepX} ${toY(v)}`).join(' ');
}

export default function TrendChart({ labels = [], series = [], height = 220 }) {
  const width = 720; // virtual width for drawing; SVG scales responsivamente

  const paths = useMemo(() => series.map(s => ({
    name: s.name,
    color: s.color,
    d: buildPath(s.data, width, height),
  })), [series, height]);

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-100" role="img" aria-label="Gráfico de tendências">
        {/* Grade leve */}
        <g stroke="#e9ecef" strokeWidth="1">
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1="0" x2={width} y1={((i + 1) * height) / 5} y2={((i + 1) * height) / 5} />
          ))}
        </g>

        {/* Séries */}
        {paths.map((p, idx) => (
          <g key={idx}>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}

        {/* Labels simples no eixo X */}
        <g fill="#6c757d" fontSize="12">
          {labels.map((l, i) => (
            <text key={l} x={(i * width) / (labels.length)} y={height - 2} textAnchor="start">{l}</text>
          ))}
        </g>
      </svg>
      <div className="legend mt-2">
        {series.map((s) => (
          <span key={s.name} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
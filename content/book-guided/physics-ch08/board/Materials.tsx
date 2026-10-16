export function Materials({ mode }: { mode: 'states' | 'structure' | 'bonds' }) {
  const cells =
    mode === 'states'
      ? ['Solid', 'Liquid', 'Gas', 'Plasma']
      : mode === 'structure'
        ? ['Crystalline', 'Amorphous', 'Liquid path']
        : ['Particles and bonds'];
  return (
    <svg viewBox="0 0 500 330" role="img" aria-label={cells.join('، ')}>
      {cells.map((label, column) => {
        const width = 460 / cells.length;
        const x = 20 + column * width;
        const irregular = label === 'Amorphous' || label === 'Liquid';
        const count = label === 'Gas' || label === 'Plasma' ? 7 : 12;
        const gap = (width - 40) / 3;
        return (
          <g key={label}>
            <rect
              x={x + 4}
              y={45}
              width={width - 8}
              height={230}
              rx={14}
              fill="#15233a"
              stroke="#2b3d5a"
            />
            {label === 'Liquid path' ? (
              <path
                d={`M${x + 20},235 l30,-55 35,35 -10,-90 42,20 -15,-65`}
                fill="none"
                stroke="#f6b84b"
                strokeWidth="5"
              />
            ) : (
              Array.from({ length: count }, (_, i) => {
                const spread = label === 'Gas' || label === 'Plasma';
                const cx = x + 22 + (i % 3) * gap + (irregular ? ((i * 17) % 15) - 6 : 0);
                const cy = spread
                  ? 76 + i * 25
                  : 130 + Math.floor(i / 3) * 32 + (irregular ? (i * 7) % 14 : 0);
                return (
                  <g key={i}>
                    {mode === 'bonds' && i % 3 < 2 ? (
                      <path d={`M${cx},${cy} l${gap},0`} stroke="#7d8fa9" strokeWidth="3" />
                    ) : null}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={mode === 'bonds' ? 15 : 8}
                      fill={label === 'Plasma' ? '#b79dff' : i % 2 ? '#3dd6c6' : '#6cb8ff'}
                    />
                    {label === 'Plasma' ? (
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fill="#0d1626">
                        {i % 2 ? '+' : '−'}
                      </text>
                    ) : null}
                  </g>
                );
              })
            )}
            <text
              x={x + width / 2}
              y={310}
              textAnchor="middle"
              fontSize={cells.length > 2 ? 17 : 22}
              fill="#b9c6d8"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

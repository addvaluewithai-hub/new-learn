function Arrow({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate})`}
      stroke="#3dd6c6"
      fill="#3dd6c6"
      strokeWidth="4"
    >
      <path d="M0,0 L0,60" />
      <path d="M-7,47 L0,60 L7,47" />
    </g>
  );
}

export function LoadingDiagram({
  kind,
}: {
  kind: 'axial' | 'compression' | 'shear' | 'bulk' | 'bone' | 'pancakes';
}) {
  if (kind === 'bulk')
    return (
      <svg viewBox="0 0 500 330" role="img" aria-label="ضغط من كل الجهات على الجسم يغيّر الحجم">
        <circle
          cx="250"
          cy="165"
          r="86"
          fill="#15233a"
          stroke="#7d8fa9"
          strokeWidth="3"
          strokeDasharray="8 7"
        />
        <circle cx="250" cy="165" r="72" fill="#6cb8ff33" stroke="#6cb8ff" strokeWidth="4" />
        <Arrow x={250} y={15} />
        <Arrow x={400} y={165} rotate={90} />
        <Arrow x={250} y={315} rotate={180} />
        <Arrow x={100} y={165} rotate={-90} />
        <text x="250" y="162" textAnchor="middle" fill="#eef3fa" fontSize="27">
          V₀ → V
        </text>
        <text x="250" y="196" textAnchor="middle" fill="#f6b84b" fontSize="22">
          ΔP
        </text>
      </svg>
    );
  if (kind === 'shear' || kind === 'pancakes')
    return (
      <svg
        viewBox="0 0 500 330"
        role="img"
        aria-label="قوة موازية للوجه العلوي وإزاحة جانبية نسبة إلى الارتفاع"
      >
        <path d="M105,265 H385" stroke="#7d8fa9" strokeWidth="5" />
        {kind === 'pancakes' ? (
          Array.from({ length: 6 }, (_, i) => (
            <rect
              key={i}
              x={130 + i * 8}
              y={240 - i * 25}
              width="190"
              height="20"
              rx="10"
              fill="#f6b84b66"
              stroke="#f6b84b"
              strokeWidth="2"
            />
          ))
        ) : (
          <>
            <path
              d="M130,260 V100 H320 V260 Z"
              fill="none"
              stroke="#7d8fa9"
              strokeDasharray="7 7"
            />
            <path
              d="M130,260 L185,100 H375 L320,260 Z"
              fill="#6cb8ff33"
              stroke="#6cb8ff"
              strokeWidth="4"
            />
          </>
        )}
        <Arrow x={210} y={65} rotate={-90} />
        <text x="280" y="53" fill="#3dd6c6" fontSize="25">
          F →
        </text>
        <path d="M100,110 V255 M135,83 H180" stroke="#eef3fa" strokeWidth="2" />
        <text x="68" y="195" fill="#eef3fa" fontSize="27">
          h
        </text>
        <text x="135" y="72" fill="#eef3fa" fontSize="24">
          Δx
        </text>
        <text x="255" y="305" fill="#b9c6d8" textAnchor="middle" fontSize="23">
          {kind === 'pancakes' ? 'd = 13 cm' : 'Loaded face: A'}
        </text>
      </svg>
    );
  if (kind === 'compression')
    return (
      <svg
        viewBox="0 0 500 330"
        role="img"
        aria-label="حمل ضاغط محوري على العمود الصلب مع رد فعل من القاعدة"
      >
        <path d="M100,285 H380" stroke="#7d8fa9" strokeWidth="6" />
        <rect
          x="205"
          y="110"
          width="70"
          height="170"
          rx="4"
          fill="#6cb8ff33"
          stroke="#6cb8ff"
          strokeWidth="4"
        />
        <Arrow x={240} y={35} />
        <Arrow x={240} y={325} rotate={180} />
        <text x="282" y="71" fill="#3dd6c6" fontSize="25">
          F
        </text>
        <text x="130" y="200" fill="#eef3fa" fontSize="25">
          L₀
        </text>
        <text x="320" y="195" fill="#eef3fa" fontSize="25">
          A
        </text>
      </svg>
    );
  const bone = kind === 'bone';
  return (
    <svg
      viewBox="0 0 500 330"
      role="img"
      aria-label={bone ? 'عظمة العضد تحت حمل الشنطة' : 'تحميل محوري على عنصر بطول أصلي ومساحة مقطع'}
    >
      <path d="M100,78 H380" stroke="#7d8fa9" strokeWidth="6" />
      <rect
        x="205"
        y="83"
        width="70"
        height="165"
        rx={bone ? 26 : 4}
        fill={bone ? '#f6b84b33' : '#6cb8ff33'}
        stroke={bone ? '#f6b84b' : '#6cb8ff'}
        strokeWidth="4"
      />
      <Arrow x={240} y={250} />
      <text x="285" y="296" fill="#3dd6c6" fontSize="25">
        {bone ? 'mg' : 'F'}
      </text>
      <path d="M165,88 V246 M155,88 H175 M155,246 H175" stroke="#b9c6d8" strokeWidth="2" />
      <text x="135" y="178" fill="#eef3fa" fontSize="27">
        L₀
      </text>
      <text x="320" y="168" fill="#eef3fa" fontSize="27">
        A
      </text>
    </svg>
  );
}

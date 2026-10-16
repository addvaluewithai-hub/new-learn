export function StressCurve() {
  return (
    <svg
      viewBox="0 0 500 330"
      role="img"
      aria-label="منحنى توضيحي للإجهاد والانفعال، لا يحمل بيانات عددية"
    >
      <path d="M65,25 V275 H460" fill="none" stroke="#b9c6d8" strokeWidth="3" />
      <path d="M65,275 L235,118 Q285,70 355,66" fill="none" stroke="#3dd6c6" strokeWidth="5" />
      <circle cx="235" cy="118" r="7" fill="#f6b84b" />
      <circle cx="355" cy="66" r="7" fill="#ff7a93" />
      <text x="183" y="100" fill="#f6b84b" fontSize="20">
        Elastic limit
      </text>
      <text x="300" y="43" fill="#ff7a93" fontSize="20">
        Breaking point
      </text>
      <text x="290" y="115" fill="#b9c6d8" fontSize="20">
        Plastic
      </text>
      <text x="150" y="218" fill="#b9c6d8" fontSize="20">
        Linear region
      </text>
      <text x="440" y="311" fill="#eef3fa" textAnchor="end" fontSize="24">
        Strain
      </text>
      <text x="28" y="60" fill="#eef3fa" fontSize="24" transform="rotate(-90 28 60)">
        Stress
      </text>
    </svg>
  );
}

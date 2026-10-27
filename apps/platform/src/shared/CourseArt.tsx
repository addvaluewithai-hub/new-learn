export type Subject = 'physics' | 'chemistry' | 'math' | 'language';

export function subjectOf(subject = ''): Subject {
  if (/chem|كيمي/i.test(subject)) return 'chemistry';
  if (/math|رياض|computer|ذكاء/i.test(subject)) return 'math';
  if (/lang|english|arabic|philos|history|لغ|إنجليز|عربي|فلسف|تاريخ/i.test(subject))
    return 'language';
  return 'physics';
}

/** A subject cover: a tint field with one shape from the subject's own world. */
export function CourseArt({
  subject = '',
  math = false,
  badge = false,
}: {
  subject?: string;
  math?: boolean;
  badge?: boolean;
}) {
  const kind = math ? 'math' : subjectOf(subject);
  return (
    <div
      className="course-art"
      data-subject={kind}
      data-badge={badge || undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice">
        {kind === 'chemistry' ? (
          <>
            <path className="art-stroke thin" d="M60 44 L108 78 L172 38 L240 82" />
            <circle className="art-dot" cx="60" cy="44" r="16" />
            <circle className="art-dot soft" cx="108" cy="78" r="11" />
            <circle className="art-dot" cx="172" cy="38" r="20" />
            <circle className="art-dot soft" cx="240" cy="82" r="14" />
            <circle className="art-dot" cx="288" cy="32" r="9" />
          </>
        ) : kind === 'math' ? (
          <>
            <path className="art-stroke thin soft" d="M0 96 H320 M44 0 V120" />
            <path className="art-stroke" d="M44 96 C 116 96 152 22 300 16" />
            <circle className="art-dot" cx="152" cy="54" r="7" />
            <circle className="art-dot" cx="232" cy="26" r="7" />
          </>
        ) : kind === 'language' ? (
          <>
            <path className="art-stroke" d="M40 100 A 60 60 0 0 1 160 100" />
            <path className="art-stroke soft" d="M140 100 A 60 60 0 0 1 260 100" />
            <path className="art-stroke thin" d="M220 100 A 40 40 0 0 1 300 100" />
          </>
        ) : (
          <>
            <path
              className="art-stroke"
              d="M-20 60 Q 10 20 40 60 T 100 60 T 160 60 T 220 60 T 280 60 T 340 60"
            />
            <path
              className="art-stroke soft"
              d="M-20 92 Q 25 62 70 92 T 160 92 T 250 92 T 340 92"
            />
          </>
        )}
      </svg>
    </div>
  );
}

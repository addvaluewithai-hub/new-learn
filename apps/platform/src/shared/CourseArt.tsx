export function CourseArt({ subject = '', math = false }: { subject?: string; math?: boolean }) {
  if (math)
    return (
      <div className="course-art math-art" aria-hidden="true">
        <span className="art-equation">2 : 3</span>
        <div className="ratio-dots">
          <i />
          <i />
          <b />
          <b />
          <b />
        </div>
      </div>
    );
  const chemistry = /chem|كيمياء/i.test(subject);
  return (
    <div className="course-art earth-art" aria-hidden="true">
      {chemistry ? (
        <svg viewBox="0 0 180 180">
          <path d="M74 28h32M80 28v42l-38 70a10 10 0 0 0 9 14h78a10 10 0 0 0 9-14l-38-70V28" />
          <path d="M56 116h68" />
          <circle cx="82" cy="134" r="5" />
          <circle cx="102" cy="128" r="3" />
        </svg>
      ) : (
        <svg viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="66" />
          <ellipse cx="90" cy="90" rx="30" ry="66" />
          <ellipse cx="90" cy="90" rx="66" ry="26" />
          <path d="M24 90h132M90 24v132" />
        </svg>
      )}
      <span className="art-note">{subject}</span>
    </div>
  );
}

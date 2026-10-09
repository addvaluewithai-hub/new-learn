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
  return (
    <div className="course-art earth-art" aria-hidden="true">
      <svg viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="66" />
        <ellipse cx="90" cy="90" rx="30" ry="66" />
        <ellipse cx="90" cy="90" rx="66" ry="26" />
        <path d="M24 90h132M90 24v132" />
      </svg>
      <span className="art-note">{subject}</span>
    </div>
  );
}

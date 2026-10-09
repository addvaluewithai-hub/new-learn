import type { LessonPackage, VisualSpec } from './types';
import { recordingFor } from './recording';

// Validate untrusted package JSON before mounting a Player. Renderer code comes
// from an application registry, never from executable content in the package.
// Structural validity is not content approval. Publication review is a host gate.
export function validateLessonPackage(
  value: unknown,
  renderers: ReadonlySet<string>,
): LessonPackage {
  const pkg = value as LessonPackage;
  const fail = (message: string): never => {
    throw new Error(`Invalid lesson package: ${message}`);
  };
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const url = (v: unknown) =>
    typeof v === 'string' &&
    (/^\/(?!\/)/.test(v) || /^https:\/\//.test(v)) &&
    !/[\u0000-\u001f]/.test(v);
  const ids = (items: Array<{ id: string }>, label: string) => {
    if (
      items.some((item) => !item || !text(item.id)) ||
      new Set(items.map((item) => item.id)).size !== items.length
    )
      fail(`${label} IDs`);
  };
  const visual = (v: VisualSpec) => {
    if (
      !v ||
      !renderers.has(v.renderer) ||
      !v.params ||
      typeof v.params !== 'object' ||
      Array.isArray(v.params)
    )
      fail('unsupported visual');
  };
  if (!pkg || pkg.schemaVersion !== 1 || pkg.delivery !== 'recorded') fail('schema/delivery');
  for (const field of [
    'lessonId',
    'curriculumId',
    'contentRevision',
    'recordingVersion',
    'title',
    'englishTitle',
    'curriculumTitle',
  ] as const)
    if (!text(pkg[field])) fail(field);
  if (
    !Number.isInteger(pkg.lessonOrder) ||
    pkg.lessonOrder < 1 ||
    !Number.isFinite(pkg.fps) ||
    pkg.fps < 1 ||
    pkg.fps > 120
  )
    fail('order/fps');
  for (const layout of ['landscape', 'portrait'] as const) {
    const d = pkg.dimensions?.[layout];
    if (
      !d ||
      !Number.isInteger(d.width) ||
      !Number.isInteger(d.height) ||
      d.width <= 0 ||
      d.height <= 0 ||
      Math.abs(d.width / d.height - (layout === 'landscape' ? 16 / 9 : 9 / 16)) > 0.0001
    )
      fail(`dimensions ${layout}`);
  }
  if (
    !Array.isArray(pkg.scenes) ||
    !pkg.scenes.length ||
    !Array.isArray(pkg.recordings) ||
    !pkg.recordings.length
  )
    fail('empty scenes/media');
  ids(pkg.scenes, 'scene');
  ids(pkg.recordings, 'recording');
  for (const r of pkg.recordings) {
    if (
      !url(r.file) ||
      !/^[a-f0-9]{64}$/.test(r.audioHash) ||
      !Number.isFinite(r.durationMs) ||
      r.durationMs <= 0 ||
      typeof r.contentAudit?.faithful !== 'boolean' ||
      !Array.isArray(r.contentAudit.issues) ||
      r.contentAudit.issues.some((issue) => !text(issue))
    )
      fail(`media ${r.id}`);
    if (!Array.isArray(r.words) || !r.words.length || !Array.isArray(r.cues))
      fail(`timings ${r.id}`);
    let previous = -1;
    for (const w of r.words!) {
      if (
        !w ||
        !text(w.text) ||
        !Number.isFinite(w.start_ms) ||
        !Number.isFinite(w.end_ms) ||
        w.start_ms < 0 ||
        w.start_ms < previous ||
        w.end_ms <= w.start_ms ||
        w.end_ms > r.durationMs
      )
        fail(`words ${r.id}`);
      previous = w.start_ms;
    }
    ids(r.cues, 'cue');
    if (
      r.cues.some(
        (c) =>
          !Number.isFinite(c.atMs) ||
          c.atMs < 0 ||
          c.atMs >= r.durationMs ||
          !r.words!.some((w) => w.start_ms === c.atMs),
      )
    )
      fail(`cues ${r.id}`);
  }
  const questionIds = new Set<string>();
  for (const scene of pkg.scenes) {
    if (!text(scene.title) || !text(scene.script)) fail(`scene ${scene.id}`);
    visual(scene.visual);
    const r = recordingFor(pkg, scene.recordingId);
    const q = scene.question;
    if (!q) {
      if (r.questionAtMs != null) fail(`unmapped question ${scene.id}`);
      continue;
    }
    if (!text(q.id) || questionIds.has(q.id)) fail('question IDs');
    questionIds.add(q.id);
    if (
      !text(q.english) ||
      !text(q.title) ||
      !text(q.englishAnswer) ||
      !text(q.explanation) ||
      !['choice', 'choice-and-written', 'written'].includes(q.attempt)
    )
      fail(`question ${q.id}`);
    if (
      !Array.isArray(q.options) ||
      !Array.isArray(q.englishOptions) ||
      q.options.length !== q.englishOptions.length ||
      q.options.some((o) => !text(o)) ||
      q.englishOptions.some((o) => !text(o))
    )
      fail(`options ${q.id}`);
    if (
      q.attempt !== 'written' &&
      (!Number.isInteger(q.correct) ||
        q.correct < 0 ||
        q.correct >= q.options.length ||
        q.options.length < 2)
    )
      fail(`answer ${q.id}`);
    if (q.attempt !== 'choice' && !text(q.writtenLabel)) fail(`written prompt ${q.id}`);
    if (
      !Number.isFinite(r.questionAtMs) ||
      r.questionAtMs! < 0 ||
      r.questionAtMs! >= r.durationMs ||
      !r.words!.some((w) => w.start_ms === r.questionAtMs)
    )
      fail(`question onset ${q.id}`);
    if (q.readingParts) {
      if (!Array.isArray(q.readingParts) || !q.readingParts.length) fail(`question parts ${q.id}`);
      if (q.readingParts[0].atMs !== r.questionAtMs) fail(`question first onset ${q.id}`);
      let onset = r.questionAtMs!;
      for (const part of q.readingParts) {
        if (
          !part ||
          !text(part.text) ||
          !['ar', 'en'].includes(part.language) ||
          !Number.isFinite(part.atMs) ||
          part.atMs < onset ||
          !r.words!.some((w) => w.start_ms === part.atMs)
        )
          fail(`question part anchor ${q.id}`);
        onset = part.atMs;
      }
    }
    const feedback = recordingFor(pkg, q.feedbackId);
    if (
      feedback.id === r.id ||
      pkg.scenes.some((s) => s.recordingId === feedback.id) ||
      feedback.questionAtMs != null
    )
      fail(`feedback isolation ${q.id}`);
    if (q.contextVisual) visual(q.contextVisual);
    if (q.image && (!url(q.image.file) || !text(q.image.alt))) fail(`image ${q.id}`);
  }
  if (
    !Array.isArray(pkg.glossary) ||
    pkg.glossary.some((g) => !text(g.term) || !text(g.meaning)) ||
    !Array.isArray(pkg.sources) ||
    !pkg.sources.length ||
    pkg.sources.some(
      (s) =>
        !text(s.title) ||
        !text(s.locator) ||
        !text(s.availability) ||
        (s.url !== undefined && !/^https:\/\//.test(s.url)),
    )
  )
    fail('references');
  if (
    !text(pkg.review?.heading) ||
    !text(pkg.review?.summary) ||
    (pkg.guide && (!url(pkg.guide.image) || !text(pkg.guide.name)))
  )
    fail('review/guide');
  return pkg;
}

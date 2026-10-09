import modules from '../content-modules.json';
export function supportedEdition(
  edition: {
    moduleId: string;
    lessonId: string;
    contentRevision: string;
    manifestHash: string;
    runtimeVersion: string;
  } | null,
) {
  if (!edition) return false;
  const pinned = modules[edition.moduleId as keyof typeof modules];
  return (
    !!pinned &&
    pinned.lessonId === edition.lessonId &&
    pinned.contentRevision === edition.contentRevision &&
    pinned.manifestHash === edition.manifestHash &&
    pinned.runtimeVersion === edition.runtimeVersion
  );
}

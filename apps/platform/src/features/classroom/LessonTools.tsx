import { ClassroomIcon } from './ClassroomIcon';
import { useI18n } from '../../i18n';
export type GuideTool = 'guide' | 'terms' | 'notes' | 'source';
export function LessonTools({
  active,
  onTool,
  onMap,
  showMap,
}: {
  active: GuideTool | null;
  onTool: (tool: GuideTool) => void;
  onMap: () => void;
  showMap: boolean;
}) {
  const { t } = useI18n();
  return (
    <nav className="classroom-tools" aria-label={t('classroom.tools.label')}>
      <button onClick={() => onTool('guide')} aria-pressed={active === 'guide'}>
        <ClassroomIcon name="guide" />
        {t('classroom.tools.guide')}
      </button>
      <button onClick={() => onTool('terms')} aria-pressed={active === 'terms'}>
        <ClassroomIcon name="book" />
        {t('classroom.tools.terms')}
      </button>
      <button onClick={() => onTool('notes')} aria-pressed={active === 'notes'}>
        <ClassroomIcon name="notes" />
        {t('classroom.tools.notes')}
      </button>
      <button onClick={() => onTool('source')} aria-pressed={active === 'source'}>
        <ClassroomIcon name="source" />
        {t('classroom.tools.source')}
      </button>
      <button onClick={onMap} aria-pressed={showMap} aria-controls="classroom-player">
        <ClassroomIcon name="map" />
        {t('classroom.tools.scenes')}
      </button>
    </nav>
  );
}

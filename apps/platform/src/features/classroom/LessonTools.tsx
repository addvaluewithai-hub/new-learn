import { ClassroomIcon } from './ClassroomIcon';
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
  return (
    <nav className="classroom-tools" aria-label="أدوات التعلّم">
      <button onClick={() => onTool('guide')} aria-pressed={active === 'guide'}>
        <ClassroomIcon name="guide" />
        اشرح الفكرة
      </button>
      <button onClick={() => onTool('terms')} aria-pressed={active === 'terms'}>
        <ClassroomIcon name="book" />
        المصطلحات
      </button>
      <button onClick={() => onTool('notes')} aria-pressed={active === 'notes'}>
        <ClassroomIcon name="notes" />
        ملاحظاتي
      </button>
      <button onClick={() => onTool('source')} aria-pressed={active === 'source'}>
        <ClassroomIcon name="source" />
        المصدر
      </button>
      <button onClick={onMap} aria-pressed={showMap} aria-controls="classroom-player">
        <ClassroomIcon name="map" />
        المشاهد
      </button>
    </nav>
  );
}

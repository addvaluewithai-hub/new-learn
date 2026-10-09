import type { LessonPackage } from '@learn/lesson-runtime';
import { ClassroomIcon } from './ClassroomIcon';
export function ClassroomHeader({
  lesson,
  onMap,
  onSource,
  onHelp,
}: {
  lesson: LessonPackage;
  onMap: () => void;
  onSource: () => void;
  onHelp: () => void;
}) {
  return (
    <header className="classroom-header" dir="ltr">
      <a className="classroom-brand" href="/" aria-label="Learn، بداية الدرس">
        <ClassroomIcon name="book" size={30} />
        Learn
      </a>
      <nav aria-label="تنقل تجربة الدرس">
        <button onClick={onMap}>
          <ClassroomIcon name="book" size={18} />
          الدروس
        </button>
        <button onClick={onSource}>
          <ClassroomIcon name="source" size={18} />
          المكتبة
        </button>
      </nav>
      <button className="classroom-help" onClick={onHelp} aria-label="افتح دليل الدرس">
        {lesson.guide && <img src={lesson.guide.image} alt="" width={34} height={34} />}
        <span>مساعدة الدرس</span>
      </button>
    </header>
  );
}

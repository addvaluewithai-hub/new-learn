import type { LessonPackage } from '@learn/lesson-runtime';
import { ClassroomIcon } from './ClassroomIcon';
export function ClassroomHeader({
  lesson,
  onHelp,
  backHref,
}: {
  lesson: LessonPackage;
  onHelp: () => void;
  backHref?: string;
}) {
  return (
    <header className="classroom-header" dir="ltr">
      <a
        className="classroom-brand"
        href={backHref ?? '/?preview=chemistry'}
        aria-label={backHref ? 'Learn، ارجع للمنهج' : 'Learn، بداية الدرس'}
      >
        <ClassroomIcon name="book" size={30} />
        Learn
      </a>
      <button className="classroom-help" onClick={onHelp} aria-label="افتح دليل الدرس">
        {lesson.guide && <img src={lesson.guide.image} alt="" width={34} height={34} />}
        <span>مساعدة الدرس</span>
      </button>
    </header>
  );
}

import type { LessonPackage } from '@learn/lesson-runtime';
import { ClassroomIcon } from './ClassroomIcon';
import { useI18n } from '../../i18n';
export function ClassroomHeader({
  lesson,
  onHelp,
  backHref,
}: {
  lesson: LessonPackage;
  onHelp: () => void;
  backHref?: string;
}) {
  const { t } = useI18n();
  return (
    <header className="classroom-header" dir="ltr">
      <a
        className="classroom-brand"
        href={backHref ?? '/?preview=chemistry'}
        aria-label={backHref ? t('classroom.header.brandBack') : t('classroom.header.brandStart')}
      >
        <ClassroomIcon name="book" size={30} />
        Learn
      </a>
      <button
        className="classroom-help"
        onClick={onHelp}
        aria-label={t('classroom.header.openGuide')}
      >
        {lesson.guide && <img src={lesson.guide.image} alt="" width={34} height={34} />}
        <span>{t('classroom.header.help')}</span>
      </button>
    </header>
  );
}

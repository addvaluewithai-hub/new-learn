import { Brand } from '../../shared/Brand';
import { CourseArt } from '../../shared/CourseArt';
import { PlatformIcon } from '../../shared/PlatformIcon';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
export function AuthStory() {
  const { t } = useI18n();
  return (
    <section className="auth-story">
      <Brand />
      <div className="story-copy">
        <span className="eyebrow">{t('auth.story.eyebrow')}</span>
        <h1>
          <Rich k="auth.story.title" parts={{ br: <br /> }} />
        </h1>
        <p>
          <Rich k="auth.story.lead" parts={{ br: <br /> }} />
        </p>
        <div className="story-board">
          <span>{t('auth.story.board')}</span>
          <CourseArt math />
          <div className="story-note">
            <PlatformIcon name="spark" />
            <p>{t('auth.story.note')}</p>
          </div>
        </div>
      </div>
      <small className="story-bottom">{t('auth.story.bottom')}</small>
    </section>
  );
}

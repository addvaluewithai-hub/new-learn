import { Brand } from '../../shared/Brand';
import { CourseArt } from '../../shared/CourseArt';
import { PlatformIcon } from '../../shared/PlatformIcon';
export function AuthStory() {
  return (
    <section className="auth-story">
      <Brand />
      <div className="story-copy">
        <span className="eyebrow">تعلّم بطريقتك</span>
        <h1>
          الفهم بيبدأ
          <br />
          بسؤال.
        </h1>
        <p>
          اسأل، جرّب، وخد وقتك.
          <br />
          كل خطوة بتفهمها، بتفتح لك طريق.
        </p>
        <div className="story-board">
          <span>فكرة صغيرة، بتفتح حاجات كتير</span>
          <CourseArt math />
          <div className="story-note">
            <PlatformIcon name="spark" />
            <p>ليه ٢ : ٣ مش هي نفسها ٣ : ٢؟</p>
          </div>
        </div>
      </div>
      <small className="story-bottom">مساحة للتعلّم. وعلى مقاسك.</small>
    </section>
  );
}

import { ButtonLink } from '../../shared/ui';
import { Faq } from './Faq';
import { FAQ } from './faq';
import { useHead } from './head';
import { SITE_LINKS, SUPPORT_EMAIL } from './routes';
import { SiteFrame } from './SiteShell';

export default function SupportPage() {
  useHead({
    title: 'الدعم والأسئلة · New Learn',
    description: 'إزاي تتواصل معانا، وإجابات الأسئلة اللي بتتسأل كتير عن New Learn.',
    path: '/support',
  });
  return (
    <SiteFrame>
      <div className="site-title">
        <h1>محتاج مساعدة؟</h1>
        <p>
          راسلنا على <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> وبنرد في خلال يوم شغل.
          اكتب الإيميل اللي سجّلت بيه، ولينك الصفحة، ولقطة شاشة لو فيه مشكلة.
        </p>
        <div className="site-ctas">
          <ButtonLink
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('مساعدة في New Learn')}`}
          >
            ابعت إيميل
          </ButtonLink>
          <ButtonLink variant="secondary" href={SITE_LINKS.teachers}>
            صفحة المدرسين
          </ButtonLink>
        </div>
      </div>
      <section className="site-prose" aria-labelledby="faq-all">
        <div className="site-head">
          <h2 id="faq-all">الأسئلة اللي بتتسأل كتير</h2>
        </div>
        <Faq items={FAQ} open={0} />
      </section>
      <section className="site-prose" aria-labelledby="support-more">
        <div className="site-head">
          <h2 id="support-more">كمان</h2>
        </div>
        <ul>
          <li>
            <a href={SITE_LINKS.privacy}>الخصوصية</a>: إيه اللي بنخزنه ومين بيشوفه.
          </li>
          <li>
            <a href={SITE_LINKS.terms}>الشروط</a>: حسابك ومحتواك والمحتوى المصنوع بالذكاء الاصطناعي.
          </li>
          <li>شفت محتوى بيخالف حقك؟ راسلنا باللينك ووصف الحق، وبنوقفه لحد ما نراجع.</li>
        </ul>
      </section>
    </SiteFrame>
  );
}

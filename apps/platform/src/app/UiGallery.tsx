import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Chip,
  ChoiceCard,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  PillSelect,
  Segmented,
  Spinner,
  Switch,
  TextArea,
  TextInput,
} from '../shared/ui';
import { UiTokens } from './UiTokens';
import '../shared/platform.css';
import './ui-gallery.css';

/** `?preview=ui`: every token and shared part on one page (docs/design-system.md). Change a
 *  token or a part, and this page and every screen built from it change together. */
export default function UiGallery() {
  const [dialog, setDialog] = useState(false);
  const [on, setOn] = useState(true);
  const [chips, setChips] = useState(['story']);
  const [pace, setPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [who, setWho] = useState('me');
  const [name, setName] = useState('');
  const toggle = (id: string) =>
    setChips((now) => (now.includes(id) ? now.filter((c) => c !== id) : [...now, id]));
  return (
    <main className="platform-ui ui-gallery" dir="rtl">
      <header className="ui-head">
        <span className="eyebrow">New Learn</span>
        <h1>نظام التصميم</h1>
        <p>
          كل الألوان والمقاسات والمكونات المشتركة. أي تغيير هنا بيتغير في كل الشاشات اللي مبنية
          بيها.
        </p>
      </header>
      <UiTokens />
      <section className="ui-section" aria-labelledby="ui-buttons">
        <h2 id="ui-buttons">الأزرار</h2>
        <div className="ui-row">
          <Button>ابدأ البناء</Button>
          <Button variant="secondary">افتح الدرس</Button>
          <Button variant="ghost">تخطّى</Button>
          <Button variant="danger">امسح المسودة</Button>
          <Button disabled>مش متاح</Button>
        </div>
        <div className="ui-row ui-dark">
          <Button variant="accent" size="lg">
            جرّب مجانًا
          </Button>
          <ButtonLink variant="secondary" href="?preview=demos">
            شوف الديموز
          </ButtonLink>
        </div>
        <div className="ui-row">
          <Button size="sm">صغير</Button>
          <Button>عادي</Button>
          <Button size="lg">كبير</Button>
          <IconButton label="الإعدادات" variant="secondary">
            ⚙
          </IconButton>
          <IconButton label="اقفل">×</IconButton>
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-choices">
        <h2 id="ui-choices">الاختيارات</h2>
        <div className="ui-row">
          {[
            ['story', 'حكاية الأول'],
            ['steps', 'خطوة بخطوة'],
            ['examples', 'أمثلة محلولة'],
          ].map(([id, label]) => (
            <Chip key={id} pressed={chips.includes(id)} onToggle={() => toggle(id)}>
              {label}
            </Chip>
          ))}
        </div>
        <Segmented
          label="سرعة الشرح"
          value={pace}
          onChange={setPace}
          options={[
            ['slow', 'هادي'],
            ['normal', 'عادي'],
            ['fast', 'سريع'],
          ]}
        />
        <div className="ui-cards" role="radiogroup" aria-label="الكورس لمين">
          <ChoiceCard
            name="who"
            value="me"
            checked={who === 'me'}
            onChange={setWho}
            title="ليّا أنا"
          >
            بذاكر أو عايز أتعلم حاجة جديدة
          </ChoiceCard>
          <ChoiceCard
            name="who"
            value="students"
            checked={who === 'students'}
            onChange={setWho}
            title="لطلابي"
          >
            كورس أشرحه لفصل أو مجموعة
          </ChoiceCard>
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-fields">
        <h2 id="ui-fields">الحقول</h2>
        <div className="ui-fields">
          <Field id="ui-name" label="اسمك" hint="بيظهر لـNova وفي شهاداتك.">
            <TextInput id="ui-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="ui-email" label="الإيميل" error="الإيميل ده مش مكتوب صح.">
            <TextInput id="ui-email" defaultValue="mona@" aria-invalid="true" />
          </Field>
          <Field id="ui-note" label="ملاحظة للدرس">
            <TextArea id="ui-note" placeholder="اكتب اللي عايزه…" />
          </Field>
        </div>
        <div className="ui-row">
          <PillSelect
            lead="للطلاب"
            label="المستوى"
            defaultValue="beginner"
            options={[
              ['beginner', 'مبتدئين'],
              ['some', 'عندهم خلفية'],
            ]}
          />
          <Switch checked={on} onChange={setOn} hint="Nova بتقرأ كل خطوة بصوت.">
            الشرح بالصوت
          </Switch>
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-feedback">
        <h2 id="ui-feedback">الحالات والرسائل</h2>
        <div className="ui-row">
          <Badge>مسودة</Badge>
          <Badge tone="accent">مناسب لموضوعك</Badge>
          <Badge tone="success">صح</Badge>
          <Badge tone="danger">غلط</Badge>
          <Badge tone="warning">محتاج مراجعة</Badge>
          <Badge tone="tutor">Nova</Badge>
        </div>
        <Alert tone="error">الإيميل أو كلمة السر مش صح.</Alert>
        <Alert tone="success" title="اتحفظ">
          إعداداتك اتحفظت على الجهاز ده.
        </Alert>
        <Alert tone="info">بيتبني دلوقتي، وتقدر تقفل الصفحة.</Alert>
        <Spinner label="بنجهّز الدرس…" />
        <EmptyState title="لسه مفيش كورسات" action={<Button size="sm">اعمل أول كورس</Button>}>
          اكتب فكرة وهنبني لك أول درس تفاعلي في دقايق.
        </EmptyState>
      </section>
      <section className="ui-section" aria-labelledby="ui-surfaces">
        <h2 id="ui-surfaces">الأسطح</h2>
        <div className="ui-cards">
          <Card>
            <strong>كارت عادي</strong>
            <p>للمحتوى الأساسي على الصفحة.</p>
          </Card>
          <Card tone="soft">
            <strong>كارت هادي</strong>
            <p>لمجموعة إعدادات أو ملخص.</p>
          </Card>
          <Card tone="outline">
            <strong>كارت بإطار</strong>
            <p>لعنصر في قايمة.</p>
          </Card>
        </div>
        <Button variant="secondary" onClick={() => setDialog(true)}>
          افتح نافذة
        </Button>
      </section>
      {dialog && (
        <Dialog
          title="تمسح المسودة؟"
          description="مش هتقدر ترجّعها بعد كده."
          onClose={() => setDialog(false)}
          footer={
            <>
              <Button variant="danger" onClick={() => setDialog(false)}>
                امسح
              </Button>
              <Button variant="secondary" onClick={() => setDialog(false)}>
                رجوع
              </Button>
            </>
          }
        />
      )}
    </main>
  );
}

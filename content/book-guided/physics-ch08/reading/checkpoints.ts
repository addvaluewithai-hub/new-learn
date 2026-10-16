import type { ReadingScene } from '@learn/lesson-runtime/core';
import { lessonText } from './text';
export type Checkpoint = {
  after: string;
  english: string;
  arabic: string;
  options: string[];
  correct: number;
  why: string;
};
const q = (
  after: string,
  english: string,
  arabic: string,
  options: string[],
  correct: number,
  why: string,
): Checkpoint => ({ after, english, arabic, options, correct, why });
/** Teacher-authored concept checks, explicitly distinct from the four book exercises. */
export const checkpoints: Checkpoint[] = [
  q(
    'P121-A',
    'Which change takes matter from solid to liquid?',
    'إيه اسم التحول من Solid إلى Liquid؟',
    ['Melting', 'Condensation', 'Freezing', 'Ionization'],
    0,
    'Melting هو التحول من Solid إلى Liquid. Freezing هو العكس؛ Condensation من Gas إلى Liquid؛ وIonization مرتبط بتكوين Plasma.',
  ),
  q(
    'P122-A',
    'How do atoms move in the solid model just discussed?',
    'الذرات في نموذج الـSolid بتتحرك إزاي؟',
    [
      'They never move',
      'They travel freely through the solid',
      'They vibrate about equilibrium positions',
      'They all become free ions',
    ],
    2,
    'الذرات بتعمل Vibration حوالين Equilibrium positions. ثبات موضع الاتزان مش سكون تام، ومش حركة حرة زي Gas، ومش معناه إن المادة بقت Plasma.',
  ),
  q(
    'P122-B',
    'A solid is moved into a larger empty container. What happens without an applied deforming force?',
    'نقلنا قطعة Solid لوعاء أكبر من غير قوة تشوّهها. نتوقع إيه؟',
    [
      'It fills the container',
      'Its volume must double',
      'It loses its definite shape',
      'It retains its definite shape and volume',
    ],
    3,
    'الـSolid له Definite shape وDefinite volume في الظروف المقصودة. كبر الوعاء وحده لا يضاعف حجمه ولا يجعله يملأ الوعاء.',
  ),
  q(
    'P123-B',
    'What distinguishes crystalline from amorphous solids here?',
    'إيه الفرق الأساسي في التصنيف اللي شرحناه؟',
    [
      'Only crystalline atoms vibrate',
      'Long-range structural order',
      'Amorphous solids contain no atoms',
      'All amorphous solids are gases',
    ],
    1,
    'الفرق هو Long-range order. النوعان مواد صلبة ولهما جسيمات تتحرك اهتزازيًا؛ Amorphous لا يعني مفيش ترتيب محلي أو إن المادة Gas.',
  ),
  q(
    'P123-C',
    'What does the irregular path in figure (c) represent?',
    'الخط المتعرج في Figure (c) بيمثل إيه؟',
    [
      'A third crystal structure',
      'An electrical wire',
      'A molecule moving in a liquid',
      'A stress–strain curve',
    ],
    2,
    'التعليق المطبوع بيقول Motion of a molecule in a liquid. ده مسار حركة، مش رسم لنوع ثالث من البنية الصلبة، ولا منحنى Stress–Strain.',
  ),
  q(
    'P124-B',
    'The same force acts on rods A and B. B has twice A’s cross-sectional area. What is the stress in B relative to A?',
    'نفس Force، لكن مساحة مقطع B ضعف A. الـStress في B يبقى كام بالنسبة لـA؟',
    ['Twice', 'One half', 'The same', 'Four times'],
    1,
    'Stress = F/A. مع ثبات F ومضاعفة A، الـStress يقل للنصف. اختيار الضعف يعكس العلاقة، والمساواة تتجاهل تغيّر المساحة.',
  ),
  q(
    'P124-C',
    'What is the unit of strain?',
    'الـStrain له أنهي وحدة؟',
    ['No unit', 'Pa', 'N', 'm²'],
    0,
    'الـStrain نسبة تشوّه إلى بُعد أصلي من نفس النوع، فالوحدات بتختصر. Pa للـStress، وN للقوة، وm² للمساحة.',
  ),
  q(
    'P125-B',
    'What makes a deformation elastic?',
    'إيه اللي يخلّينا نوصف التشوّه إنه Elastic؟',
    [
      'The original shape returns after unloading',
      'Every part of the graph must be a straight line',
      'The specimen has already broken',
      'Stress must be zero throughout loading',
    ],
    0,
    'Elastic يعني يرجع للشكل الأصلي بعد إزالة الحمل. Linearity شرط مختلف؛ Breaking أو انعدام Stress طول الاختبار مش تعريف المرونة.',
  ),
  q(
    'P125-C',
    'Which modulus describes resistance to parallel sliding of planes?',
    'نختار أنهي Modulus لمقاومة انزلاق مستويات موازية لبعض؟',
    ['Young’s modulus', 'Bulk modulus', 'Shear modulus', 'Density'],
    2,
    'Shear modulus للحركة الموازية وتغيّر الشكل بالقص. Young’s modulus للتشوّه المحوري، وBulk modulus لتغيّر الحجم، وDensity مش معامل مرونة.',
  ),
  q(
    'P126-B',
    'Which unit is equivalent to a pascal?',
    'Pa تكافئ أنهي وحدة؟',
    ['N/m', 'm/N', 'N·m', 'N/m²'],
    3,
    'Pa = N/m² لأن Stress قوة على مساحة. N/m تخص Spring constant، وN·m مش وحدة Stress.',
  ),
  q(
    'P126-C',
    'What does a larger elastic modulus establish in the stated linear model?',
    'كبر Elastic modulus يدل على إيه في النموذج الخطي؟',
    [
      'A guaranteed larger failure load',
      'Less strain at the same stress',
      'A larger strain at the same stress',
      'No possible deformation',
    ],
    1,
    'Modulus أكبر يعني Strain أقل عند نفس Stress: استجابة أكثر Stiffness. ده لا يحدد Failure load وحده، ولا يعني إن التشوّه مستحيل.',
  ),
  q(
    'P127-B',
    'A rod has original length 0.30 m and extension 0.003 m. What is its strain?',
    'جرّب دي: L₀ = 0.30 m وΔL = 0.003 m. احسب Strain.',
    ['100', '0.001', '0.01', '0.303 m'],
    2,
    'Strain = ΔL/L₀ = 0.003/0.30 = 0.01 بلا وحدة. قلب النسبة يعطي 100، وجمع الطولين لا يعطي Strain.',
  ),
  q(
    'P127-D',
    'Two rods have the same material and area. B is twice as long. Compare Y and axial stiffness k.',
    'نفس المادة والمساحة، وطول B ضعف A. إيه المقارنة الصحيحة؟',
    [
      'Same Y; B has half the k',
      'B has twice the Y and k',
      'Same Y and same k',
      'B has half the Y; same k',
    ],
    0,
    'Y خاصية المادة تحت نفس الظروف، وk = YA/L₀ خاصية العنصر بأبعاده. مضاعفة الطول تخلي k للنصف؛ ما تغيّرش Y.',
  ),
  q(
    'P128-B',
    'In the illustrated simple shear model, shear strain is lateral displacement divided by what?',
    'في النموذج اللي شرحناه، بنقسم Lateral displacement على إيه؟',
    ['Diameter', 'Face area', 'Applied force', 'Height between the faces'],
    3,
    'Shear strain = Δx/h. المقام هو المسافة بين الوجهين في اتجاه الارتفاع. Face area تدخل في Shear stress، والقوة لا تقيس بُعدًا هندسيًا.',
  ),
  q(
    'P129-B',
    'For a positive pressure increase and positive bulk modulus, what is the sign of ΔV?',
    'لو ΔP موجب وB موجب، إشارة ΔV تكون إيه؟',
    ['Positive', 'Negative', 'Always zero', 'Cannot be inferred'],
    1,
    'من B = −ΔP/(ΔV/V₀)، زيادة الضغط تقلّل الحجم في النموذج ده، فيكون ΔV سالبًا. الصفر معناه مفيش تغيّر حجم، والموجب يعني تمددًا.',
  ),
  q(
    'P133-Q4',
    'Why is depth not needed again when the pressure increase is already supplied?',
    'بعد المسألة: ليه مش محتاجين نحسب الضغط من العمق مرة تانية؟',
    [
      'Depth is always irrelevant to pressure',
      'The sphere has no volume',
      'The required ΔP is already given',
      'Atmospheric pressure replaces ΔP',
    ],
    2,
    'العلاقة محتاجة V₀ وB وΔP، وكلهم معطيين. العمق يصف الموقف هنا؛ مش بنضيف ضغطًا جويًا إلى زيادة الضغط المعطاة، ومش بنقول إن العمق لا يؤثر في الضغط عمومًا.',
  ),
];

export function checkpointScene(check: Checkpoint, renderer: string, page: number): ReadingScene {
  const id = `${check.after}-check`;
  const visual = {
    renderer,
    params: { sectionId: check.after, page, checkpoint: true, rawSteps: [] },
  };
  const answer = check.options[check.correct];
  return {
    id,
    title: `اختبر فهمك · ص ${page}`,
    clipId: `${id}-ask`,
    visual,
    steps: [{ unitIds: [`${id}-prompt`], text: check.english, written: true }],
    question: {
      id,
      english: check.english,
      arabic: lessonText(`${check.arabic}`),
      attempt: 'choice',
      options: check.options,
      answer: { english: answer, arabic: lessonText(check.why) },
      feedback: {
        clipId: `${id}-feedback`,
        visual,
        steps: [
          {
            unitIds: [`${id}-answer`],
            text: lessonText(check.why),
            written: true,
          },
        ],
      },
    },
  };
}

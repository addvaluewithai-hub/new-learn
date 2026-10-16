/** Keep scientific names consistent in our narration; book excerpts remain English. */
const terms: [string, string][] = [
  ['المواد الصلبة', 'الـSolids'],
  ['المادة الصلبة', 'الـSolid'],
  ['الصلبة', 'الـSolid'],
  ['الصلب', 'الـSolid'],
  ['صلبة', 'Solid'],
  ['صلب', 'Solid'],
  ['السوائل', 'الـLiquids'],
  ['السائل', 'الـLiquid'],
  ['سائل', 'Liquid'],
  ['الغازات', 'الـGases'],
  ['الغاز', 'الـGas'],
  ['غاز', 'Gas'],
  ['البلازما', 'الـPlasma'],
  ['بلازما', 'Plasma'],
  ['حد المرونة', 'Elastic limit'],
  ['المرونة', 'الـElasticity'],
  ['إجهادات', 'Stresses'],
  ['للإجهاد', 'للـStress'],
  ['للانفعال', 'للـStrain'],
  ['البلوري', 'الـCrystalline'],
  ['غير البلوري', 'الـAmorphous'],
  ['معامل المرونة الحجمي', 'Bulk modulus'],
  ['معامل يونج', 'Young’s modulus'],
  ['معامل القص', 'Shear modulus'],
  ['معامل الحجم', 'Bulk modulus'],
  ['معامل المرونة', 'Elastic modulus'],
  ['إجهاد القص', 'Shear stress'],
  ['انفعال القص', 'Shear strain'],
  ['الإجهاد', 'الـStress'],
  ['إجهاد', 'Stress'],
  ['الانفعال', 'الـStrain'],
  ['انفعال', 'Strain'],
  ['الاستطالة', 'الـExtension'],
  ['استطالة', 'Extension'],
  ['الصلابة', 'الـStiffness'],
  ['صلابة', 'Stiffness'],
  ['البلورية', 'الـCrystalline'],
  ['غير البلورية', 'الـAmorphous'],
  ['بلورية', 'Crystalline'],
  ['غير بلورية', 'Amorphous'],
];
export function spokenTerms(text: string) {
  // Match Arabic words, not substrings inside longer words or formulas.
  for (const [arabic, english] of [...terms].sort((a, b) => b[0].length - a[0].length))
    text = text.replace(
      new RegExp(`(?<![\\p{Script=Arabic}])([وفبكل]?)${arabic}(?![\\p{Script=Arabic}])`, 'gu'),
      (_, prefix: string) =>
        `${prefix}${prefix && !english.startsWith('الـ') ? 'الـ' : ''}${english}`,
    );
  // Legacy bilingual glosses must not become “Solid, Solid” after term replacement.
  const names = [
    'Young[’\\x27]s modulus',
    'Elastic modulus',
    'Shear modulus',
    'Bulk modulus',
    'Shear stress',
    'Shear strain',
    'Crystalline',
    'Amorphous',
    'Stiffness',
    'Extension',
    'Elasticity',
    'Stress',
    'Strain',
    'Solids?',
    'Liquids?',
    'Gases?',
    'Plasma',
  ];
  const echo = new RegExp(`(${names.join('|')})[\\s,،;؛:：()（）]+(?:الـ)?\\1\\b`, 'gi');
  for (let i = 0; i < 3; i++) text = text.replace(echo, '$1');
  return text;
}

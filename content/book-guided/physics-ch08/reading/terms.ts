/** Keep scientific names consistent in our narration; book excerpts remain English. */
const terms: [string, string][] = [
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
  return text;
}

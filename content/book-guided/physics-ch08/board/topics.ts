export const topics: Record<string, { title: string; note: string; words: string[] }> = {
  'P121-A': {
    title: 'Solids and Elasticity',
    note: 'الجسم الصلب متماسك، لكنه يستجيب للقوى.',
    words: ['Solid', 'Liquid', 'Gas', 'Plasma'],
  },
  'P122-A': {
    title: 'States of Matter',
    note: 'الجسيمات تهتز حول مواضع اتزان؛ لا تقف ساكنة.',
    words: ['Equilibrium', 'Internal forces'],
  },
  'P122-B': {
    title: 'Solids',
    note: 'شكل وحجم محددان؛ السوست نموذج للروابط.',
    words: ['Definite shape', 'Definite volume'],
  },
  'P122-C': {
    title: 'Mechanical Properties',
    note: 'نركّز على استجابة المادة للقوى.',
    words: ['Optical · Electrical', 'Thermal · Mechanical'],
  },
  'P123-B': {
    title: 'Structure of Solids',
    note: 'الفرق هو انتظام البنية على المدى البعيد.',
    words: ['Crystalline', 'Amorphous'],
  },
  'P123-C': {
    title: 'Structure and Motion',
    note: 'مسار جسيم في سائل يختلف عن رسم بنية صلب.',
    words: ['NaCl crystal', 'Amorphous · Liquid path'],
  },
  'P124-A': {
    title: 'Deformation',
    note: 'القوة الخارجية تغيّر الشكل؛ القوى الداخلية تقاوم التغيّر.',
    words: ['External force', 'Internal resistance'],
  },
  'P124-B': {
    title: 'Stress',
    note: 'قوة موزّعة على مساحة مقطع مناسبة.',
    words: ['Force F', 'Cross-sectional area A'],
  },
  'P124-C': {
    title: 'Strain',
    note: 'نقيس التشوّه نسبةً إلى البعد الأصلي.',
    words: ['Relative deformation', 'Dimensionless'],
  },
  'P125-A': {
    title: 'Stress and Strain',
    note: 'التناسب الخطي له مدى وشروط.',
    words: ['Elastic modulus', 'Linear range'],
  },
  'P125-B': {
    title: 'Stress–Strain Curve',
    note: 'الرجوع للشكل الأصلي يختلف عن بقاء العلاقة خطية.',
    words: ['Elastic · Plastic', 'Breaking point'],
  },
  'P125-C': {
    title: 'Three Elastic Moduli',
    note: 'اختيار المعامل يتبع نوع التحميل والتشوّه.',
    words: ['Young: Y', 'Shear: S', 'Bulk: B'],
  },
  'P126-A': {
    title: 'Elastic Behaviour',
    note: 'تتبّع ما يحدث عند وضع الحمل ثم إزالته.',
    words: ['Load', 'Unload'],
  },
  'P126-B': {
    title: 'Units',
    note: 'الإجهاد والمعامل بوحدة باسكال؛ الانفعال بلا وحدة.',
    words: ['Stress: Pa', 'Strain: no unit'],
  },
  'P126-C': {
    title: 'Stiffness',
    note: 'الصلابة المرنة تختلف عن حدّ الفشل.',
    words: ['Stiffness', 'Failure strength'],
  },
  'P127-A': {
    title: 'Young’s Modulus',
    note: 'شد محوري وقوة عمودية على المقطع.',
    words: ['Axial loading', 'Tensile stress'],
  },
  'P127-B': {
    title: 'Longitudinal Strain',
    note: 'فرق الطول على الطول الأصلي.',
    words: ['Original length L₀', 'Extension ΔL'],
  },
  'P127-C': {
    title: 'Young’s Modulus',
    note: 'اربط الإجهاد بالانفعال في المدى الخطي.',
    words: ['Stress / Strain', 'Material property'],
  },
  'P127-D': {
    title: 'Rod and Spring',
    note: 'المادة ثابتة؛ تغيير الأبعاد يغيّر صلابة العنصر.',
    words: ['Young’s modulus Y', 'Axial stiffness k'],
  },
  'P128-A': {
    title: 'Shear',
    note: 'القوة موازية للوجه، والإزاحة جانبية.',
    words: ['Parallel force', 'Lateral displacement'],
  },
  'P128-B': {
    title: 'Shear Modulus',
    note: 'المساحة للوجه المحمّل، والإزاحة على الارتفاع.',
    words: ['Shear stress', 'Shear strain'],
  },
  'P128-C': {
    title: 'Bulk Modulus',
    note: 'ضغط من كل الجهات يغيّر الحجم.',
    words: ['Pressure increase', 'Volume change'],
  },
  'P129-A': {
    title: 'Volume Compression',
    note: 'عند زيادة الضغط يكون فرق الحجم سالبًا.',
    words: ['V − V₀ < 0', 'ΔP > 0'],
  },
  'P129-B': {
    title: 'Signed Bulk Relation',
    note: 'العلاقة الصحيحة توضيح من المعلّم للموضع المشوّه.',
    words: ['Bulk modulus B', 'Sign convention'],
  },
  'P130-Q1': {
    title: 'Exercise 1 · Steel Beam',
    note: 'حدّد المعطيات الناقصة قبل اختيار قيمة عددية.',
    words: ['L₀ = 4.0 m', 'A = 8 × 10⁻³ m²'],
  },
  'P131-Q2': {
    title: 'Exercise 2 · Humerus',
    note: 'ابدأ بنوع التحميل ووحّد الوحدات.',
    words: ['m = 21 kg', 'L₀ = 0.33 m', 'A = 5.2 × 10⁻⁴ m²'],
  },
  'P132-Q3': {
    title: 'Exercise 3 · Pancakes',
    note: 'قطر الوجه ليس نصف قطره.',
    words: ['F = 1.2 N', 'd = 13 cm', 'h = 9 cm · Δx = 2.5 cm'],
  },
  'P133-Q4': {
    title: 'Exercise 4 · Lead Sphere',
    note: 'استخدم زيادة الضغط والمعامل المعطيين.',
    words: ['V₀ = 0.50 m³', 'ΔP = 2.0 × 10⁷ Pa', 'B = 4.2 × 10¹⁰ Pa'],
  },
  'P133-Z': {
    title: 'End of Chapter 8',
    note: 'نختار النموذج من اتجاه الحمل ونوع التشوّه.',
    words: ['Young · Shear · Bulk', 'Units · Assumptions'],
  },
};

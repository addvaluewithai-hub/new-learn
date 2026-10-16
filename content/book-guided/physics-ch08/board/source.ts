/** Verbatim excerpts transcribed from the supplied scans; figures are exact crops. */
export type SourceExcerpt = {
  quotes: string[];
  image?: string | string[];
  formula?: string;
  note?: string;
  teacherFormula?: string;
};
export const bookSource: Record<string, SourceExcerpt> = {
  'P121-A': { quotes: ['Solids and Elasticity', 'States of Matter'], image: 'states' },
  'P122-A': {
    quotes: [
      'Matter is normally classified as being in one of three states, solid, liquid, or gas.',
      'The atoms in a solid, held together by forces that are mainly electrical, are located at specific positions with respect to one another and vibrate about those positions.',
    ],
    image: 'springs',
  },
  'P122-B': {
    quotes: [
      'Has definite volume\nHas definite shape',
      'Molecules are held in specific locations by electrical forces vibrate about equilibrium positions',
      'Can be modeled as springs connecting molecules.',
    ],
    image: 'springs',
  },
  'P122-C': {
    quotes: ['Optical, electrical, magnetic, thermal and mechanical properties of solids.'],
  },
  'P123-B': {
    quotes: [
      'Solids can be classified as either crystalline or amorphous.\nIn a crystalline solid the atoms have an ordered structure.',
      'In an amorphous solid, such as glass, the atoms are arranged almost randomly.',
    ],
    image: ['crystal', 'amorphous'],
  },
  'P123-C': {
    quotes: [
      'The NaCl structure, with the Na(gray) and Cl(green) ions at alternate corners of a cube.',
      'In an amorphous solid, the atoms are arranged randomly.',
      'Erratic motion of a molecule in a liquid.',
    ],
    image: ['crystal', 'amorphous', 'liquid-path', 'structure'],
  },
  'P124-A': {
    quotes: [
      'Actually, all objects are deformable to some extent.',
      'It is possible to change the size and/or shape of the object by applying external forces.',
      'Internal forces resist the deformation.',
    ],
  },
  'P124-B': {
    quotes: [
      'Is proportional to the force causing the deformation',
      'It is the external force acting on the object per unit cross-sectional area.',
    ],
    image: 'stress-strain',
    formula: '\\mathrm{Stress}=\\frac{F}{A}',
  },
  'P124-C': {
    quotes: ['Is the result of a stress', 'Is a measure of the degree of deformation.'],
    image: 'stress-strain',
  },
  'P125-A': {
    quotes: [
      'Stress = Constant (Elastic Moduli) Strain',
      'The elastic modulus is the constant of proportionality between the stress and the strain.',
    ],
  },
  'P125-B': {
    quotes: ['Elastic Limit', 'Plastic', 'Breaking Point'],
    image: 'curve',
    note: 'الرسم نوعي. الجزء بعد Breaking Point لا يمثّل عيّنة سليمة نتابع تحميلها.',
  },
  'P125-C': {
    quotes: [
      'Young’s Modulus\nMeasures the resistance of a solid to a change in its length',
      'Shear Modulus\nMeasures the resistance of motion of the planes within a solid parallel to each other',
      'Bulk Modulus\nMeasures the resistance of solids or liquids to changes in their volume',
    ],
  },
  'P126-A': {
    quotes: [
      'It’s possible to change its shape and volume by applying external forces.',
      'A sufficiently large force will permanently deform or break an object.',
      'means that the object tends to return to its original shape and size after removing the external forces.',
    ],
  },
  'P126-B': {
    quotes: [
      'Stress is the force per unit area causing a deformation. Unit Is N/m² or Pa',
      'strain is a measure of the amount of the deformation. Has no unit',
    ],
    formula: '\\mathrm{Stress}=\\frac{\\mathrm{Force}}{\\mathrm{Area}}',
  },
  'P126-C': {
    quotes: [
      'For sufficiently small stresses, stress is proportional to strain, with the constant of proportionality depending on the material being deformed and on the nature of the deformation.',
      'The elastic modulus is analogous to a spring constant. It can be taken as the stiffness of a material: A material having a large elastic modulus is very stiff and difficult to deform.',
    ],
  },
  'P127-A': {
    quotes: ['We define the tensile stress as'],
    formula: '\\mathrm{Stress}=\\frac{\\mathrm{Tensile\\ Force}}{\\mathrm{Area}}=\\frac{F}{A}',
  },
  'P127-B': {
    quotes: [
      'The tensile strain in this case is defined as the ratio of the change in length ΔL to the original length L₀ and is therefore a dimensionless quantity.',
    ],
    formula: '\\mathrm{Strain}=\\frac{\\Delta L}{L_0}',
  },
  'P127-C': {
    quotes: ['Since Stress = Elastic modulus × strain'],
    formula: '\\frac{F}{A}=Y\\frac{\\Delta L}{L_0}',
  },
  'P127-D': {
    quotes: [
      'Hooke’s law can be written as F = kΔL',
      'Where F is the applied force, ΔL is the elongation of the spring and k is the spring constant',
    ],
    image: 'hooke',
    formula: 'F=\\left(\\frac{YA}{L_0}\\right)\\Delta L',
  },
  'P128-A': {
    quotes: [
      'occurs when an object is subjected to a force parallel to one of its faces while the opposite face is held fixed by a second force',
    ],
    image: 'shear',
  },
  'P128-B': {
    quotes: [
      'A shear deformation in which a rectangular block is distorted by forces applied tangent to two of its faces.',
      'A book under shear stress.',
    ],
    image: 'shear',
    formula: '\\frac{F}{A}=S\\frac{\\Delta x}{h}',
  },
  'P128-C': {
    quotes: [
      'The bulk modulus characterizes the response of a substance to uniform squeezing. Suppose that the external forces acting on an object are all perpendicular to the surface',
    ],
  },
  'P129-A': {
    quotes: [
      'This occurs when an object is immersed in a fluid. An object subject to this type of deformation undergoes a change in volume but no change in shape.',
    ],
  },
  'P129-B': {
    quotes: ['Change in pressure = stress'],
    note: 'العلاقة مشوّهة في الصورة. الصيغة التالية توضيح من المعلّم، وليست نسخًا حرفيًا للمطبوع.',
    teacherFormula: 'B=-\\frac{\\Delta P}{\\Delta V/V_0}',
  },
  'P130-Q1': {
    quotes: [
      'A vertical steel beam in a building supports a load of 6 × 10^[unclear exponent] N.',
      '(a) If the length of the beam is 4.0 m and its cross-sectional area is 8 × 10⁻³ m², find the distance the beam is compressed along its length.',
      '(b) What maximum load in Newtons could the steel beam support before failing?',
    ],
    note: 'أسّ الحمل غير واضح في النسخة المرفقة؛ المقطع بين القوسين علامة تحريرية للموضع غير المقروء.',
  },
  'P131-Q2': {
    quotes: [
      'At the local airport, a person carries a 21-kg duffel bag in one hand. Assuming the humerus (the upper arm bone) supports the entire weight of the bag, determine the amount by which it stretches.',
      '(The humerus may be assumed to be 33 cm in length and to have an effective cross-sectional area of 5.2 × 10⁻⁴ m²)',
    ],
    image: 'humerus',
  },
  'P132-Q3': {
    quotes: [
      'A horizontal force of 1.2 N is applied to the top of a stack of pancakes 13 cm in diameter and 9.0 cm high.',
      'The result is a shear deformation of 2.5 cm. What is the shear modulus for these pancakes?',
    ],
    image: 'pancakes',
  },
  'P133-Q4': {
    quotes: [
      'A solid lead sphere of volume 0.50 m³, dropped in the ocean, sinks to a depth of 2.0 × 10³ m, where the pressure increases by 2.0 × 10⁷ Pa.',
      'Lead has a bulk modulus of 4.2 × 10¹⁰ Pa. What is the change in volume of the sphere?',
    ],
  },
};

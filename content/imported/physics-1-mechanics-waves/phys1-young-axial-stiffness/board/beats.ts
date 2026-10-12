// Force amber; extension cyan; material purple. Geometry is schematic, never to scale.
export type Beat = { caption: string; rows: string[]; mode?: string; force?: string; length?: string; area?: string; material?: string; extension?: string; stretch?: number; second?: number; long?: boolean; thick?: boolean };
export const beats: Record<string, Beat[]> = {
S01: [
 {caption:'من الحمل… نتوقع التغيّر',rows:['σ = \\f{F}{A}','ε = \\f{ΔL}{L₀}'],stretch:25},
 {caption:'نفس الأبعاد والقوة… مادتان مختلفتان',rows:['F₁ = F₂','A₁ = A₂ \\q L₁ = L₂'],stretch:20,second:40},
 {caption:'مثال توضيحي من تأليفنا',rows:['σ = 2×10^{6}\\ \\t{Pa}','ε₁ = 0.001','ε₂ = 0.002'],stretch:20,second:40},
 {caption:'نقارن الإجهاد لكل انفعال',rows:['\\f{2×10^{6}}{0.001} = 2×10^{9}','\\f{2×10^{6}}{0.002} = 10^{9}'],stretch:20,second:40},
 {caption:'معامل أكبر ≠ مقاومة كسر أكبر',rows:['Y₁ = 2×10^{9}\\ \\t{Pa}','Y₂ = 10^{9}\\ \\t{Pa}','Y = \\f{σ}{ε}'],stretch:20,second:40},
],
S02: [
 {caption:'المساحة والطول قبل التحميل',rows:['L₀ \\q A','\\t{Linear elastic}'],stretch:25},
 {caption:'نسبة الإجهاد إلى الانفعال',rows:['Y = \\f{σ}{ε}'],stretch:25},
 {caption:'القسمة على كسر = الضرب في مقلوبه',rows:['Y = \\f{σ}{ε}','Y = \\f{F}{A} × \\f{L₀}{ΔL}'],stretch:25},
 {caption:'نرتّب العلاقة لإيجاد الاستطالة',rows:['Y = \\f{FL₀}{AΔL}','YΔL = \\f{FL₀}{A}','\\box{ΔL = \\f{FL₀}{YA}}'],stretch:25},
 {caption:'نفس الوحدة… كميتان مختلفتان',rows:['[Y] = \\f{\\t{Pa}}{1} = \\t{Pa}','σ : \\t{loading}','Y : \\t{material response}'],stretch:25},
],
S03: [
 {caption:'القوة ضعف → الاستطالة ضعف',rows:['ΔL = \\f{FL₀}{YA}','F → 2F','ΔL → 2ΔL'],force:'2F',stretch:50},
 {caption:'جزآن: استطالتاهما تتجمعان',rows:['L₀ → 2L₀','ΔL → 2ΔL'],length:'2L₀',long:true,stretch:50},
 {caption:'المقطع ضعف → الاستطالة نصف',rows:['A → 2A','σ → \\f{σ}{2}','ΔL → \\f{ΔL}{2}'],area:'2A',thick:true,stretch:12},
 {caption:'معامل المادة ضعف → الاستطالة نصف',rows:['Y → 2Y','ΔL → \\f{ΔL}{2}'],material:'2Y',stretch:12},
 {caption:'المساحة: نحول البُعدين',mode:'square',rows:['1\\ \\t{mm} = 10^{-3}\\ \\t{m}','1\\ \\t{mm²} = 10^{-6}\\ \\t{m²}','\\no{1\\ \\t{mm²} ≠ 10^{-3}\\ \\t{m²}}']},
],
S04: [
 {caption:'مثال من تأليفنا — الاستطالة مجهولة',rows:['Y = 10^{11}\\ \\t{Pa}','ΔL = ?'],force:'1000 N',length:'2 m',area:'2 × 10⁻⁴ m²'},
 {caption:'نحسب البسط والمقام منفصلين',rows:['FL₀ = 1000×2 = 2000','YA = 10^{11}×2×10^{-4}','YA = 2×10^{7}'],force:'1000 N',length:'2 m',area:'2 × 10⁻⁴ m²'},
 {caption:'الاستطالة مكبّرة للتوضيح',rows:['ΔL = \\f{2000}{2×10^{7}}','ΔL = 10^{-4}\\ \\t{m}','\\box{ΔL = 0.1\\ \\t{mm}}'],force:'1000 N',length:'2 m',extension:'0.1 mm',stretch:25},
 {caption:'فحص النتيجة من طريق تاني',rows:['σ = 5×10^{6}\\ \\t{Pa}','ε = \\f{σ}{Y} = 5×10^{-5}','εL₀ = 10^{-4}\\ \\t{m}'],force:'1000 N',length:'2 m',stretch:25},
 {caption:'جرّب قبل التالي: القوة اتضاعفت',rows:['F = 2000\\ \\t{N}','ΔL = ?'],force:'2000 N',length:'2 m'},
 {caption:'نفس الأبعاد والمادة — ضعف الاستطالة',rows:['F → 2F','\\box{ΔL = 0.2\\ \\t{mm}}'],force:'2000 N',length:'2 m',stretch:50,extension:'0.2 mm'},
],
S05: [
 {caption:'صلابة العنصر — تشبيه بنابض',mode:'spring',rows:['k : \\t{axial stiffness}','[k] = \\t{N/m}'],stretch:25},
 {caption:'قانون هوك لمقادير الشد',mode:'spring',rows:['F = kΔL','k = \\f{F}{ΔL}','k = \\f{1000}{10^{-4}} = 10^{7}\\ \\t{N/m}'],stretch:25},
 {caption:'نقارن معامل الاستطالة في العلاقتين',rows:['F = (\\f{YA}{L₀})ΔL','F = kΔL','\\box{k = \\f{YA}{L₀}}'],stretch:25},
 {caption:'نفس المادة — صلابتان مختلفتان',rows:['Y₁ = Y₂','L₂ = 2L₁','k₂ = \\f{k₁}{2}'],stretch:20,second:40,long:true},
 {caption:'الاسترجاع عكس الإزاحة',mode:'restore',rows:['Fᵣ = -kx','\\t{Magnitudes:} \\q F = kΔL'],stretch:30},
],
S06: [
 {caption:'راجع الشروط قبل التعويض',rows:['\\t{Axial · uniform}','\\t{Small · linear elastic}','ΔL = \\f{FL₀}{YA}'],stretch:20},
 {caption:'المرونة وحدها لا تعني الخطية',mode:'curve',rows:['\\t{Nonlinear response}','\\no{Y ≠ constant}']},
 {caption:'سؤال جديد — محاولتك قبل الحل',rows:['σ = ? \\q ε = ?','Y = ? \\q k = ?'],extension:'?',force:'F',length:'L₀'},
],
S09: [
 {caption:'حمل → انفعال → خاصية مادة',rows:['σ = \\f{F}{A}','ε = \\f{ΔL}{L₀}','Y = \\f{σ}{ε}'],stretch:25},
 {caption:'استطالة العنصر وصلابته',rows:['ΔL = \\f{FL₀}{YA}','k = \\f{YA}{L₀}','[Y] = \\t{Pa} \\q [k] = \\t{N/m}'],stretch:25},
 {caption:'بعد كده: القص — Shear',mode:'shear',rows:['\\t{Shear deformation}']},
],
};

INSERT INTO learn_app.curricula(id,title,description,subject,visibility) VALUES ('chemistry-gas-laws','الكيمياء · قوانين الغازات','من حالات المادة إلى قوانين الغازات، خطوة بخطوة.','Chemistry — الكيمياء','published') ON CONFLICT DO NOTHING;
INSERT INTO learn_app.lessons(id,curriculum_id,position,title,subtitle) VALUES ('chem-gas-states-matter','chemistry-gas-laws',1,'States of Matter — حالات المادة: الخصائص',''),
('chem-gas-phase-changes','chemistry-gas-laws',2,'Phase Changes — تغيرات الحالة & Gas Behavior — سلوك الغاز',''),
('chem-gas-boyles-law','chemistry-gas-laws',3,'Boyle''s Law — قانون بويل: الضغط والحجم',''),
('chem-gas-boyle-problems','chemistry-gas-laws',4,'Boyle Problems — مسائل قانون بويل',''),
('chem-gas-charles-law','chemistry-gas-laws',5,'Charles'' Law — قانون شارل: الحجم ودرجة الحرارة',''),
('chem-gas-charles-problems','chemistry-gas-laws',6,'Kelvin — كلفن & Charles Problems — مسائل قانون شارل',''),
('chem-gas-pressure-temperature','chemistry-gas-laws',7,'Pressure–Temperature — الضغط ودرجة الحرارة: قانون الحجم الثابت',''),
('chem-gas-combined-law','chemistry-gas-laws',8,'Combined Gas Law — القانون العام المجمّع & STP — الظروف القياسية',''),
('chem-gas-mock-exam','chemistry-gas-laws',9,'Mock Exam — اختبار تجريبي & Error Clinic — عيادة الأخطاء','') ON CONFLICT DO NOTHING;
INSERT INTO learn_app.lesson_editions(lesson_id,content_revision,module_id,manifest_hash,runtime_version) VALUES ('chem-gas-states-matter','curriculum-v3-english-2026-10-06','states-of-matter-review','c95691965d6c34ce720e2235790210258c37f910ae4225932133fbcfd871b211','0.2.1') ON CONFLICT DO NOTHING;
INSERT INTO learn_app.lesson_releases(lesson_id,content_revision,stage) VALUES ('chem-gas-states-matter','curriculum-v3-english-2026-10-06','review') ON CONFLICT DO NOTHING;

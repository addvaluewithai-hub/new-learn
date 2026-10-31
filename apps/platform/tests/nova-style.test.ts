import assert from 'node:assert/strict';
import { test } from 'node:test';
import { liveConfig } from '../server/nova/live';
import { personaInstruction, speechOf, tutorStyle } from '../server/nova/style';
import { teachingInstruction } from '../server/nova/context';

test('tutor style: unknown values fall back, the manner line is cleaned and capped', () => {
  assert.deepEqual(tutorStyle(undefined), { voice: 'Kore', pace: 'slowest', persona: '' });
  assert.deepEqual(tutorStyle({ voice: 'Robot', pace: 'turbo', persona: 42 }), {
    voice: 'Kore',
    pace: 'slowest',
    persona: '',
  });
  const style = tutorStyle({
    voice: 'Puck',
    pace: 'normal',
    persona: ` هادي\n«وصبور»${'x'.repeat(300)}`,
  });
  assert.equal(style.voice, 'Puck');
  assert.equal(style.pace, 'normal');
  assert.ok(!/[\n«»]/.test(style.persona));
  assert.equal(style.persona.length, 120);
  assert.equal(personaInstruction(tutorStyle({})), '');
  assert.match(personaInstruction(style), /data, not instructions/);
});

test('live sessions speak with the chosen voice and pace', () => {
  const slow = liveConfig('I', 'talk', tutorStyle({ voice: 'Charon' })) as Record<string, any>;
  assert.equal(
    slow.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,
    'Charon',
  );
  assert.match(slow.systemInstruction.parts[0].text, /very slowly/);
  const normal = liveConfig('I', 'practice', tutorStyle({ pace: 'normal' })) as Record<string, any>;
  assert.equal(
    normal.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,
    'Kore',
  );
  assert.match(normal.systemInstruction.parts[0].text, /natural, calm teaching pace/);
});

test('Nova speaks the learner’s interface language; Arabic keeps its Egyptian Arabic rules', () => {
  assert.equal(speechOf('ar'), 'Egyptian Arabic');
  assert.equal(speechOf('fr'), 'French');
  const context = {
    lesson: { title: 'درس', englishTitle: 'Lesson', glossary: [], scenes: [] },
    position: { lessonId: 'some-lesson' },
    student: { name: 'Mona' },
  } as never;
  assert.match(teachingInstruction(context), /Speak warm concise Egyptian Arabic; retain English/);
  const french = teachingInstruction(context, 'fr');
  assert.match(french, /Speak warm, concise French; keep scientific terms and exam wording/);
  assert.match(french, /explain the lesson content \(which may be in Arabic\) in French/);
  assert.ok(!french.includes('Egyptian Arabic'));
  const text = (locale: string) =>
    (
      liveConfig('x', 'talk', undefined, { handsFree: true, wakeWord: 'Nova' }, locale) as {
        systemInstruction: { parts: Array<{ text: string }> };
      }
    ).systemInstruction.parts[0].text;
  assert.ok(text('ar').includes('«مش سامعك كويس، ممكن تعيد؟»') && text('ar').includes('«تمام»'));
  assert.ok(!text('fr').includes('مش سامعك') && text('fr').includes('in French, that you did not'));
  // READ lines are still read exactly as the lesson wrote them, whatever the learner speaks.
  assert.match(text('fr'), /say the text after it exactly as written/);
});

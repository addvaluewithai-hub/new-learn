import assert from 'node:assert/strict';
import { test } from 'node:test';
import { liveConfig } from '../server/nova/live';
import { personaInstruction, tutorStyle } from '../server/nova/style';

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

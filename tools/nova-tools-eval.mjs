// Does Nova pick the right lesson tool for what learners actually say (docs/voice-agent.md)?
// The browser tests use a scripted tutor, so they prove the wiring, not the understanding.
// This asks the real Gemini Live model, with the real hands-free session setup, what it does
// with each phrase, typed as the learner's turn (the spoken path adds transcription on top).
//
//   GEMINI_API_KEY=… npm run eval:nova-tools        (a few cents; the key is never printed)
//
// Exits 1 when fewer than 90% of the phrases get the expected tool.
import { liveConfig } from '../apps/platform/server/nova/live.ts';

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('Set GEMINI_API_KEY in the environment (never paste it into a chat).');
  process.exit(2);
}
const model = process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
const QUESTION = 'READ QUESTION:\nقولّي بكلامك: نظرية المعرفة بتسأل عن إيه؟';
const LINE = 'READ:\nالفلاسفة بيفرّقوا بين تلات أنواع من المعرفة.';
const LESSON =
  'You are Nova, a friendly tutor speaking Egyptian Arabic. Lesson: an introduction to epistemology (نظرية المعرفة): what knowledge is, its three kinds, and the classical definition.';

// [what the learner says, where they are, the expected tool call ("action" or a tool name;
// null means no tool: a question for Nova)]
const CASES = [
  ['فوّت السؤال ده', QUESTION, 'skip_question'],
  ['عدّي السؤال ده', QUESTION, 'skip_question'],
  ['مش عايز أجاوب، خلينا نكمل', QUESTION, 'skip_question'],
  ['سيبك من السؤال ده', QUESTION, 'skip_question'],
  ['skip this one', QUESTION, 'skip_question'],
  ['معرفش الإجابة', QUESTION, 'show_answer'],
  ['قولّي الإجابة', QUESTION, 'show_answer'],
  ['وريني الحل', QUESTION, 'show_answer'],
  ['مش عارف، قولّي إنت', QUESTION, 'show_answer'],
  ["I don't know", QUESTION, 'show_answer'],
  ['عيد السؤال تاني', QUESTION, 'repeat'],
  ['مسمعتش، عيد', QUESTION, 'repeat'],
  ['عيد الحتة دي', LINE, 'repeat'],
  ['ارجع خطوة', LINE, 'back'],
  ['ارجع للي قبله', LINE, 'back'],
  ['اللي بعده', LINE, 'next'],
  ['استنى شوية', LINE, 'pause'],
  ['وقّف ثانية', LINE, 'pause'],
  ['كمّل', LINE, 'resume'],
  ['يلا نكمل', LINE, 'resume'],
  ['بتسأل إزاي بنعرف الحاجات', QUESTION, 'submit_answer'],
  ['عن المعرفة ومنين بتيجي', QUESTION, 'submit_answer'],
  ['يعني إيه نظرية؟', QUESTION, null],
  ['ممكن تديني مثال؟', LINE, null],
  ['يعني إيه المعرفة الإجرائية؟', LINE, null],
];

/** Opens a session, sets the scene, says the phrase, and returns the first tool call. */
function ask(phrase, scene) {
  const config = liveConfig(LESSON, 'talk', undefined, { handsFree: true, wakeWord: 'يا نوفا' });
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(key)}`,
    );
    let stage = 'setup',
      call = null;
    const timer = setTimeout(() => finish(new Error('timed out')), 30000);
    const finish = (error) => {
      clearTimeout(timer);
      socket.close();
      error ? reject(error) : resolve(call);
    };
    const send = (value) => socket.send(JSON.stringify(value));
    const turn = (text) =>
      send({ clientContent: { turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true } });
    socket.onopen = () => send({ setup: { model: `models/${model}`, ...config } });
    socket.onerror = () => finish(new Error('connection failed'));
    socket.onmessage = async (event) => {
      const text = typeof event.data === 'string' ? event.data : await event.data.text();
      const message = JSON.parse(text);
      if (message.error) return finish(new Error(message.error.message ?? 'session error'));
      if (message.setupComplete) {
        stage = 'scene';
        return turn(scene);
      }
      for (const fn of message.toolCall?.functionCalls ?? []) {
        call ??= fn.name === 'lesson_control' ? fn.args?.action : fn.name;
        send({
          toolResponse: {
            functionResponses: [{ id: fn.id, name: fn.name, response: { ok: true } }],
          },
        });
      }
      if (!message.serverContent?.turnComplete) return;
      if (stage === 'scene') {
        stage = 'phrase';
        call = null; // only what the learner's phrase causes counts
        return turn(phrase);
      }
      finish();
    };
  });
}

let right = 0;
for (const [phrase, scene, expected] of CASES) {
  let got;
  try {
    got = await ask(phrase, scene);
  } catch (error) {
    got = `error: ${error.message}`;
  }
  const ok = got === expected;
  if (ok) right++;
  console.log(
    `${ok ? '✓' : '✗'} ${phrase}  →  ${got ?? 'no tool'}${ok ? '' : `  (expected ${expected ?? 'no tool'})`}`,
  );
}
const score = right / CASES.length;
console.log(`\n${right}/${CASES.length} (${Math.round(score * 100)}%) with ${model}`);
process.exit(score >= 0.9 ? 0 : 1);

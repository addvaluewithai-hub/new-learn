import { SOURCE } from '../../src/i18n/core';
import { DEFAULT_STYLE, paceInstruction, speechOf, type TutorStyle } from './style';
/**
 * Live voice setup. `practice` is the end-of-lesson spoken quiz (the model hears turns on its
 * own). `talk` is hold-to-talk inside the lesson: the client marks when the learner starts and
 * stops speaking, and quietly tells the tutor where the learner is as they move.
 */
/** Hands-free (audio) mode: the learner can't see or touch the screen and answers by voice. */
export type HandsFree = { handsFree: boolean; wakeWord: string };
const HANDS_FREE = (wakeWord: string, locale: string) =>
  `\nHANDS-FREE MODE: the learner cannot see or touch the screen (it may be off) and speaks without holding a button. After a READ QUESTION, wait silently as long as it takes, even many minutes. When the learner answers that question, call submit_answer with their answer in their own words and say nothing else (if they say they do not know, call lesson_control with show_answer instead): the app then shows the model answer and you will be asked to read it. If they ask something instead, answer briefly and wait again. If their words are unclear, ${unclear(locale)} Never repeat the question more than once in a row. Never say «${wakeWord}» (the learner's word for calling you).`;
const SUBMIT = {
  name: 'submit_answer',
  description:
    "Submit the learner's spoken answer to the lesson question you just read, in their own words.",
  parameters: {
    type: 'OBJECT',
    properties: { answer: { type: 'STRING' } },
    required: ['answer'],
  },
};
/** Moving through the lesson by voice (docs/voice-agent.md); the app applies it. */
export const LESSON_ACTIONS = [
  'skip_question',
  'show_answer',
  'repeat',
  'back',
  'next',
  'pause',
  'resume',
  'go_to_scene',
] as const;
const CONTROL = {
  name: 'lesson_control',
  description:
    'Move through the lesson, only when the learner asks: skip_question leaves the open question unanswered and goes on; show_answer shows its model answer (the learner does not know); repeat says the current line again; back and next move one step; pause stops and waits; resume continues; go_to_scene opens the start of the scene named by sceneId (one of the lesson scenes), to show a part again or to go on to it.',
  parameters: {
    type: 'OBJECT',
    properties: {
      action: { type: 'STRING', enum: [...LESSON_ACTIONS] },
      sceneId: { type: 'STRING', description: 'For go_to_scene: the scene id from the lesson.' },
    },
    required: ['action'],
  },
};
// What Nova says in a word or two: the Arabic lines as written; other languages by name.
const unclear = (locale: string) =>
  locale === SOURCE
    ? 'say only «مش سامعك كويس، ممكن تعيد؟».'
    : `say only, in ${speechOf(locale)}, that you did not hear them well and ask them to repeat.`;
const okay = (locale: string) => (locale === SOURCE ? '«تمام»' : `"okay" in ${speechOf(locale)}`);
const CONTROL_RULE = (locale: string) =>
  `\nWhen the learner asks to skip a question, to see the answer (or says they do not know it), to hear a line again, to go back, to go on, to pause or to continue, call lesson_control with that action; when they ask to see or hear a part of the lesson again (or you need to show it to explain), call it with go_to_scene and that scene's sceneId, and when you are done there, with go_to_scene back to where they were. Then say only a word or two such as ${okay(locale)}; if the result has a line, say that line exactly instead; if it has an error, say it in one short sentence. Never call lesson_control unless the learner asked.`;

export function liveConfig(
  instruction: string,
  purpose: 'practice' | 'talk',
  style: TutorStyle = DEFAULT_STYLE,
  mode: HandsFree = { handsFree: false, wakeWord: '' },
  locale = SOURCE,
) {
  const speech = {
    responseModalities: ['AUDIO'],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: style.voice } } },
  };
  const pace = paceInstruction(style);
  if (purpose === 'talk')
    return {
      generationConfig: speech,
      systemInstruction: {
        parts: [
          {
            text: `${instruction}\n${pace}\nThe learner is reading the lesson and holds a button to ask you something by voice. Answer what they asked about the step they are on, in two to four short spoken sentences, then stop and let them continue; offer one follow-up only if useful. A message starting with READ is the next line of the lesson for you to say aloud: say the text after the colon exactly as written, word for word, adding nothing (no greeting, no "next", no comment), clearly like a patient teacher in a classroom rather than a conversation, at the pace above with natural pauses at commas. READ may carry a direction in parentheses before the colon, such as READ (slowly, with wonder): it is a silent instruction on how to deliver that one line (tone, feeling, speed, emphasis); follow it in your voice and never say it. Consecutive READ lines are one continuous explanation, so keep the same calm voice and pace from line to line. Read math naturally in Egyptian Arabic (1/2 as نص, 1/3 as تلت, x² as إكس تربيع, = as يساوي) and English words in English. READ QUESTION is a question for the learner: read it, then stay silent and never answer it yourself. Messages starting with POSITION are silent updates of where the learner now is; never reply to them on their own. Keep lesson facts exactly as the lesson states them and say plainly when something is an extra example.${CONTROL_RULE(locale)}${mode.handsFree ? HANDS_FREE(mode.wakeWord, locale) : ''}`,
          },
        ],
      },
      realtimeInputConfig: { automaticActivityDetection: { disabled: true } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      tools: [{ functionDeclarations: mode.handsFree ? [CONTROL, SUBMIT] : [CONTROL] }],
    };
  return {
    generationConfig: speech,
    systemInstruction: {
      parts: [
        {
          text: `${instruction}\n${pace}\nWhen the client supplies a practice question, ask that exact question and wait. If the learner clearly selects an option, call answer_question with questionIndex and zero-based choice. Do not advance or grade without the tool result; never reveal the answer before their attempt. If unclear, ask them to clarify. Client practice state overrides your count. After the result, explain briefly and ask the next supplied question.`,
        },
      ],
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    tools: [
      {
        functionDeclarations: [
          {
            name: 'answer_question',
            description: 'Submit the learner’s explicit option for the current practice question.',
            behavior: 'BLOCKING',
            parameters: {
              type: 'OBJECT',
              properties: { questionIndex: { type: 'INTEGER' }, choice: { type: 'INTEGER' } },
              required: ['questionIndex', 'choice'],
            },
          },
        ],
      },
    ],
  };
}

const ENDINGS = ['goaway', 'dropped', 'error', 'idle', 'closed'];
/** A live session's length and ending, for the logs (no user, no lesson, no words). */
export function sessionEnd(input: Record<string, unknown>) {
  const seconds = Number(input.seconds);
  return {
    event: 'nova_session_end',
    seconds: Number.isFinite(seconds) ? Math.min(7200, Math.max(0, Math.round(seconds))) : 0,
    reason: ENDINGS.includes(input.reason as string) ? input.reason : 'other',
    handsFree: input.handsFree === true,
  };
}

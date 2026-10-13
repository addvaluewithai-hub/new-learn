import { DEFAULT_STYLE, paceInstruction, type TutorStyle } from './style';
/**
 * Live voice setup. `practice` is the end-of-lesson spoken quiz (the model hears turns on its
 * own). `talk` is hold-to-talk inside the lesson: the client marks when the learner starts and
 * stops speaking, and quietly tells the tutor where the learner is as they move.
 */
export function liveConfig(
  instruction: string,
  purpose: 'practice' | 'talk',
  style: TutorStyle = DEFAULT_STYLE,
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
            text: `${instruction}\n${pace}\nThe learner is reading the lesson and holds a button to ask you something by voice. Answer what they asked about the step they are on, in two to four short spoken sentences, then stop and let them continue; offer one follow-up only if useful. A message starting with READ is the next line of the lesson for you to say aloud: say the text after it exactly as written, word for word, adding nothing (no greeting, no "next", no comment), clearly like a patient teacher in a classroom rather than a conversation, at the pace above with natural pauses at commas. Consecutive READ lines are one continuous explanation, so keep the same calm voice and pace from line to line. Read math naturally in Egyptian Arabic (1/2 as نص, 1/3 as تلت, x² as إكس تربيع, = as يساوي) and English words in English. READ QUESTION is a question for the learner: read it, then stay silent and never answer it yourself. Messages starting with POSITION are silent updates of where the learner now is; never reply to them on their own. Keep lesson facts exactly as the lesson states them and say plainly when something is an extra example.`,
          },
        ],
      },
      realtimeInputConfig: { automaticActivityDetection: { disabled: true } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
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

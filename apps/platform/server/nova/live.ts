/**
 * Live voice setup. `practice` is the end-of-lesson spoken quiz (the model hears turns on its
 * own). `talk` is hold-to-talk inside the lesson: the client marks when the learner starts and
 * stops speaking, and quietly tells the tutor where the learner is as they move.
 */
export function liveConfig(instruction: string, purpose: 'practice' | 'talk') {
  if (purpose === 'talk')
    return {
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
      systemInstruction: {
        parts: [
          {
            text: `${instruction}\nThe learner is reading the lesson and holds a button to ask you something by voice. Answer what they asked about the step they are on, in two to four short spoken sentences, then stop and let them continue; offer one follow-up only if useful. Messages starting with POSITION are silent updates of where the learner now is; never reply to them on their own. Keep lesson facts exactly as the lesson states them and say plainly when something is an extra example.`,
          },
        ],
      },
      realtimeInputConfig: { automaticActivityDetection: { disabled: true } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
  return {
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
    systemInstruction: {
      parts: [
        {
          text: `${instruction}\nWhen the client supplies a practice question, ask that exact question and wait. If the learner clearly selects an option, call answer_question with questionIndex and zero-based choice. Do not advance or grade without the tool result; never reveal the answer before their attempt. If unclear, ask them to clarify. Client practice state overrides your count. After the result, explain briefly and ask the next supplied question.`,
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

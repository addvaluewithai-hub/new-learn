import type { Env, AuthUser } from '../env';
import { body, HttpError, json } from '../http';
import { assistantContext, teachingInstruction } from './context';
import { generate, gemini } from './provider';
import { quizSchema, validateQuiz } from './quiz';
import { limitNova } from './limits';
export function chatHistory(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > 16)
    throw new HttpError(400, 'المحادثة غير صحيحة.');
  return value.map((item, index) => {
    if (
      !item ||
      item.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
      typeof item.text !== 'string' ||
      !item.text.trim() ||
      item.text.length > 2000
    )
      throw new HttpError(400, 'الرسالة غير صحيحة.');
    return { role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.text }] };
  });
}
export async function novaRoute(request: Request, env: Env, user: AuthUser, action: string) {
  if (!['chat', 'live', 'quiz'].includes(action) || request.method !== 'POST')
    throw new HttpError(404, 'الطلب غير موجود.');
  const input = await body(request);
  const context = await assistantContext(env, user, input);
  limitNova(user.id, action);
  const instruction = teachingInstruction(context);
  if (action === 'chat') {
    const contents = chatHistory(input.messages);
    if (contents.length % 2 === 0) throw new HttpError(400, 'اكتب سؤالًا أولًا.');
    return json({ text: await generate(env, instruction, contents, undefined, request.signal) });
  }
  if (action === 'quiz') {
    const text = await generate(
      env,
      `${instruction}\nGenerate exactly 10 varied multiple-choice practice questions ONLY from the taught lesson. English prompts/options/englishAnswer, Arabic translation/explanation. Four distinct plausible options, exactly one correct zero-based index. Cite an existing sceneId for each. Include recall and application, no unsupported calculations. This is practice, not an official exam.`,
      [{ role: 'user', parts: [{ text: 'Prepare the ten-question lesson practice.' }] }],
      quizSchema,
      request.signal,
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HttpError(502, 'الاختبار محتاج إعادة تجهيز.');
    }
    return json({
      questions: validateQuiz(parsed, new Set(context.lesson.scenes.map((s) => s.id))),
      contentRevision: context.lesson.contentRevision,
    });
  }
  const model = env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
  const config = {
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
  const token = await gemini(
    env,
    'auth_tokens',
    {
      uses: 1,
      expireTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
      bidiGenerateContentSetup: { model: `models/${model}`, ...config },
    },
    request.signal,
  );
  if (typeof token.name !== 'string') throw new HttpError(502, 'تعذّر تجهيز المكالمة.');
  return json({ token: token.name, model, config });
}

import type { Env, AuthUser } from '../env';
import { body, HttpError, json } from '../http';
import { assistantContext, teachingInstruction } from './context';
import { generate, gemini } from './provider';
import { quizSchema, validateQuiz } from './quiz';
import { limitNova } from './limits';
import { liveConfig, sessionEnd } from './live';
import { personaInstruction, speechOf, tutorStyle } from './style';
import { SOURCE } from '../../src/i18n/core';
import { wakePrompt, wakeSchema, wakeVerdict, wakeWav, wakeWordOf } from './wake';
export function chatHistory(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > 16)
    throw new HttpError(400, 'nova.badChat');
  return value.map((item, index) => {
    if (
      !item ||
      item.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
      typeof item.text !== 'string' ||
      !item.text.trim() ||
      item.text.length > 2000
    )
      throw new HttpError(400, 'nova.badMessage');
    return { role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.text }] };
  });
}
/** The quiz's languages: the schema keeps its field names; the learner's language fills them. */
const quizLanguages = (locale: string) =>
  locale === SOURCE
    ? 'English prompts/options/englishAnswer, Arabic translation/explanation.'
    : `English prompts/options/englishAnswer; the "arabic" field holds the ${speechOf(locale)} translation of the prompt and "explanation" is in ${speechOf(locale)} (the field names stay as they are).`;
export async function novaRoute(
  request: Request,
  env: Env,
  user: AuthUser,
  action: string,
  locale = SOURCE,
) {
  if (!['chat', 'live', 'quiz', 'wake', 'ended'].includes(action) || request.method !== 'POST')
    throw new HttpError(404, 'nova.unknownAction');
  const input = await body(request, action === 'wake' ? 160_000 : 16_384);
  if (action === 'wake') {
    // Hands-free mode: did this short clip call the tutor by the learner's wake word?
    const word = wakeWordOf(input.word);
    limitNova(user.id, action);
    const audio = { inlineData: { mimeType: 'audio/wav', data: wakeWav(input.audio) } };
    const text = await generate(
      env,
      wakePrompt(word),
      [{ role: 'user', parts: [audio] }],
      wakeSchema,
      request.signal,
    );
    return json({ wake: wakeVerdict(text) });
  }
  if (action === 'ended') {
    // How long live sessions last and why they end: one log line, nothing stored.
    limitNova(user.id, action);
    console.log(JSON.stringify(sessionEnd(input)));
    return json({ ok: true });
  }
  const context = await assistantContext(env, user, input);
  limitNova(user.id, action);
  const style = tutorStyle(input.style);
  const instruction = teachingInstruction(context, locale) + personaInstruction(style);
  if (action === 'chat') {
    const contents = chatHistory(input.messages);
    if (contents.length % 2 === 0) throw new HttpError(400, 'nova.askFirst');
    return json({ text: await generate(env, instruction, contents, undefined, request.signal) });
  }
  if (action === 'quiz') {
    const text = await generate(
      env,
      `${instruction}\nGenerate exactly 10 varied multiple-choice practice questions ONLY from the taught lesson. ${quizLanguages(locale)} Four distinct plausible options, exactly one correct zero-based index. Cite an existing sceneId for each. Include recall and application, no unsupported calculations. This is practice, not an official exam.`,
      [{ role: 'user', parts: [{ text: 'Prepare the ten-question lesson practice.' }] }],
      quizSchema,
      request.signal,
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HttpError(502, 'nova.quizUnreadable');
    }
    return json({
      questions: validateQuiz(parsed, new Set(context.lesson.scenes.map((s) => s.id))),
      contentRevision: context.lesson.contentRevision,
    });
  }
  const model = env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
  const handsFree = input.purpose === 'talk' && input.handsFree === true;
  const config = liveConfig(
    instruction,
    input.purpose === 'talk' ? 'talk' : 'practice',
    style,
    {
      handsFree,
      wakeWord: handsFree ? wakeWordOf(input.wakeWord) : '',
    },
    locale,
  );
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
  if (typeof token.name !== 'string') throw new HttpError(502, 'nova.callFailed');
  return json({ token: token.name, model, config });
}

import type { Env } from '../env';
import { HttpError } from '../http';
export async function gemini(env: Env, path: string, payload: unknown, signal?: AbortSignal) {
  if (!env.GEMINI_API_KEY) throw new HttpError(503, 'مساعدة Nova مش متاحة حاليًا.');
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([AbortSignal.timeout(45000), ...(signal ? [signal] : [])]),
    });
  } catch {
    throw new HttpError(504, 'الرد اتأخر. جرّب تاني.');
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 429 ? 429 : 502,
      response.status === 429
        ? 'طلبات كتير دلوقتي. استنى شوية وجرّب تاني.'
        : 'تعذّر الاتصال بمساعدة Nova. جرّب تاني.',
    );
  return response.json();
}
export async function generate(
  env: Env,
  instruction: string,
  contents: unknown[],
  schema?: unknown,
  signal?: AbortSignal,
) {
  const result = await gemini(
    env,
    `models/${env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash-lite'}:generateContent`,
    {
      systemInstruction: { parts: [{ text: instruction }] },
      contents,
      generationConfig: {
        maxOutputTokens: schema ? 12000 : 2000,
        ...(schema ? { responseMimeType: 'application/json', responseJsonSchema: schema } : {}),
      },
    },
    signal,
  );
  const text = result.candidates?.[0]?.content?.parts
    ?.filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
    .trim();
  if (!text) throw new HttpError(502, 'مفيش رد واضح. جرّب صياغة السؤال تاني.');
  return text as string;
}

import { canSee, listenCourses, listenOutline } from '../../../../content/listen/courses';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { limitNova } from '../nova/limits';
import { gemini, generate } from '../nova/provider';
import { tutorStyle } from '../nova/style';
import { listenConfig, listenInstruction, type ListenSpot } from './instruction';
import { wakePrompt, wakeSchema, wakeVerdict, wakeWav } from './wake';

/** Resolves a client position against the server-owned course; nothing else is trusted. */
export function listenSpot(input: Record<string, unknown>): ListenSpot {
  const course = typeof input.courseId === 'string' ? listenCourses[input.courseId] : undefined;
  if (!course) throw new HttpError(404, 'المنهج الصوتي غير موجود.');
  const lessonIndex = course.lessons.findIndex((l) => l.id === input.lessonId);
  const lesson = course.lessons[lessonIndex];
  const sceneIndex = lesson ? lesson.scenes.findIndex((s) => s.id === input.sceneId) : -1;
  if (!lesson || sceneIndex < 0) throw new HttpError(400, 'موضع الدرس غير صحيح.');
  return { course, lesson, lessonIndex, scene: lesson.scenes[sceneIndex], sceneIndex };
}

/**
 * Listen mode (audio-only lessons):
 *  GET  /api/listen/          the courses this account may see (titles)
 *  GET  /api/listen/<course>  titles only
 *  POST /api/listen/live      single-use live token for one scene, setup locked server-side
 *  POST /api/listen/wake      did this short clip call the tutor by its wake word?
 */
export async function listenRoute(request: Request, env: Env, user: AuthUser, action: string) {
  const visible = (id: string) => {
    const course = listenCourses[id];
    // A course this account may not see answers exactly like one that does not exist.
    if (!course || !canSee(course, user.email))
      throw new HttpError(404, 'المنهج الصوتي غير موجود.');
    return course;
  };
  if (request.method === 'GET' && !action)
    return json({
      courses: Object.values(listenCourses)
        .filter((course) => canSee(course, user.email))
        .map(({ id, title, description }) => ({ id, title, description })),
    });
  if (request.method === 'GET') return json(listenOutline(visible(action)));
  if (request.method !== 'POST' || !['live', 'wake'].includes(action))
    throw new HttpError(404, 'الطلب غير موجود.');
  const input = await body(request, action === 'wake' ? 160_000 : 16_384);
  const spot = listenSpot(input);
  visible(spot.course.id);
  limitNova(user.id, action === 'live' ? 'listen' : 'wake');
  if (action === 'wake') {
    const text = await generate(
      env,
      wakePrompt(spot.course.wakeWord),
      [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: 'audio/wav', data: wakeWav(input.audio) } }],
        },
      ],
      wakeSchema,
      request.signal,
    );
    return json({ wake: wakeVerdict(text) });
  }
  const style = tutorStyle(input.style);
  const config = listenConfig(listenInstruction(spot, user.name, style), style);
  const model = env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
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
  if (typeof token.name !== 'string') throw new HttpError(502, 'تعذّر تجهيز الدرس الصوتي.');
  return json({ token: token.name, model, config });
}

import type { Db } from '../db/connection';
import type { FeedbackStatus } from '../db/authoring';
import { HttpError } from '../http';
import type { AuthorLesson } from '../authoring/format';
import {
  addLesson,
  createCourse,
  getLesson,
  listCourses,
  updateCourse,
  updateLesson,
} from '../authoring/store';
import { getBoard, putBoard } from '../authoring/boardStore';
import { boardReports, listFeedback, setFeedback } from '../authoring/feedback';
import { GUIDE } from './guide';
import { courseFields, filesSchema, id, lessonSchema, object } from './schemas';

/** Who is calling (from the OAuth token, never from arguments) and where previews live. */
export type ToolContext = { db: Db; user: { id: string; name: string }; origin: string };
type Args = Record<string, unknown>;
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
  run: (args: Args, context: ToolContext) => Promise<unknown>;
};

const str = (args: Args, key: string, required = true) => {
  const v = args[key];
  if (v === undefined && !required) return undefined;
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${key} is required`);
  return v.trim();
};
const uuid = (args: Args, key: string) => {
  const v = str(args, key)!;
  if (!/^[0-9a-f-]{36}$/i.test(v))
    throw new HttpError(400, `${key} must be an id from this server`);
  return v;
};
const preview = (c: ToolContext, lessonId: string) => `${c.origin}/?draft=${lessonId}`;
const read = { readOnlyHint: true, idempotentHint: true };
const write = { readOnlyHint: false, destructiveHint: false };

export const TOOLS: Tool[] = [
  {
    name: 'get_authoring_guide',
    title: 'Read the authoring guide',
    description: 'How to write New Learn lessons and interactive boards. Read this first.',
    inputSchema: object({}),
    annotations: read,
    run: async () => GUIDE,
  },
  {
    name: 'list_my_courses',
    title: 'List my courses',
    description: 'The teacher’s draft courses with their lessons, revisions and preview links.',
    inputSchema: object({}),
    annotations: read,
    run: async (_, c) => ({
      courses: (await listCourses(c.db, c.user.id)).map((course) => ({
        ...course,
        lessons: course.lessons.map((l) => ({ ...l, previewUrl: preview(c, l.id) })),
      })),
    }),
  },
  {
    name: 'create_course',
    title: 'Create a course',
    description:
      'Start a new draft course for the teacher. Returns its id. First ask the teacher the short round of choices in the guide ("Ask first") and agree on an outline, unless they already chose.',
    inputSchema: object(courseFields, ['title']),
    annotations: write,
    run: async (args, c) => {
      const row = await createCourse(c.db, c.user.id, {
        title: str(args, 'title')!,
        subject: str(args, 'subject', false),
        description: str(args, 'description', false),
        language: str(args, 'language', false),
      });
      return { courseId: row.id, title: row.title };
    },
  },
  {
    name: 'update_course',
    title: 'Update a course',
    description:
      'Rename a course, change its description, or regroup its lessons into ordered parts ' +
      '(every lesson exactly once).',
    inputSchema: object(
      {
        courseId: id('The course to change.'),
        ...courseFields,
        parts: {
          type: 'array',
          items: object(
            { title: { type: 'string' }, lessonIds: { type: 'array', items: { type: 'string' } } },
            ['title', 'lessonIds'],
          ),
        },
      },
      ['courseId'],
    ),
    annotations: { ...write, idempotentHint: true },
    run: async (args, c) => {
      const row = await updateCourse(c.db, c.user.id, uuid(args, 'courseId'), {
        title: str(args, 'title', false),
        subject: str(args, 'subject', false),
        description: str(args, 'description', false),
        parts: Array.isArray(args.parts) ? (args.parts as never) : undefined,
      });
      return { courseId: row.id, title: row.title, parts: row.parts };
    },
  },
  {
    name: 'add_lesson',
    title: 'Add a lesson',
    description:
      'Add a lesson to a course. It is checked and saved as revision 1; open previewUrl to see it.',
    inputSchema: object({ courseId: id('The course.'), lesson: lessonSchema }, [
      'courseId',
      'lesson',
    ]),
    annotations: write,
    run: async (args, c) => {
      const saved = await addLesson(
        c.db,
        c.user.id,
        uuid(args, 'courseId'),
        args.lesson as AuthorLesson,
      );
      return { ...saved, previewUrl: preview(c, saved.lessonId) };
    },
  },
  {
    name: 'get_lesson',
    title: 'Read a lesson',
    description:
      'A lesson as last saved (or at an older revision), in the format add_lesson takes.',
    inputSchema: object(
      { lessonId: id('The lesson.'), revision: { type: 'integer', minimum: 1 } },
      ['lessonId'],
    ),
    annotations: read,
    run: async (args, c) => {
      const revision = Number.isInteger(args.revision) ? (args.revision as number) : undefined;
      const got = await getLesson(c.db, c.user.id, uuid(args, 'lessonId'), revision);
      return {
        lessonId: got.lesson.id,
        courseId: got.lesson.courseId,
        revision: got.revision,
        latestRevision: got.lesson.revision,
        lesson: got.source,
        previewUrl: preview(c, got.lesson.id),
      };
    },
  },
  {
    name: 'update_lesson',
    title: 'Update a lesson',
    description:
      'Replace a lesson with a new version. Every save is a new revision; older ones stay readable.',
    inputSchema: object(
      {
        lessonId: id('The lesson.'),
        lesson: lessonSchema,
        note: { type: 'string', maxLength: 300 },
      },
      ['lessonId', 'lesson'],
    ),
    annotations: write,
    run: async (args, c) => {
      const lessonId = uuid(args, 'lessonId');
      const saved = await updateLesson(
        c.db,
        c.user.id,
        lessonId,
        args.lesson as AuthorLesson,
        str(args, 'note', false),
      );
      return { ...saved, previewUrl: preview(c, lessonId) };
    },
  },
  {
    name: 'put_board',
    title: 'Upload a board',
    description:
      'Upload or replace an interactive board (HTML). It is checked first; lessons using its id ' +
      'move to the new version. Drawing checks run in the teacher’s preview (see get_feedback).',
    inputSchema: object({ files: filesSchema }, ['files']),
    annotations: write,
    run: async (args, c) => putBoard(c.db, c.user.id, args.files),
  },
  {
    name: 'get_board',
    title: 'Read a board',
    description: 'The newest files of a board, to edit them, and its preview check reports.',
    inputSchema: object({ boardId: { type: 'string' } }, ['boardId']),
    annotations: read,
    run: async (args, c) => {
      const row = await getBoard(c.db, c.user.id, str(args, 'boardId')!);
      return { boardId: row.boardId, hash: row.hash, files: row.files, checks: row.reports };
    },
  },
  {
    name: 'get_feedback',
    title: 'Read the teacher’s notes',
    description:
      'Notes the teacher wrote on lesson steps, with the current text there, and drawing ' +
      'problems the preview found on boards. Default: open notes only.',
    inputSchema: object({
      lessonId: id('Only this lesson (optional).'),
      status: {
        type: 'array',
        items: { type: 'string', enum: ['open', 'review', 'done', 'dismissed'] },
      },
    }),
    annotations: read,
    run: async (args, c) => ({
      notes: await listFeedback(c.db, c.user.id, {
        lessonId: args.lessonId === undefined ? undefined : uuid(args, 'lessonId'),
        status: Array.isArray(args.status) ? (args.status as FeedbackStatus[]) : ['open'],
      }),
      boardChecks: await boardReports(c.db, c.user.id),
    }),
  },
  {
    name: 'resolve_feedback',
    title: 'Mark a note handled',
    description:
      'After fixing what a note asks (update_lesson / put_board), mark it "review" with a ' +
      'one-line summary; the teacher confirms. Use "dismissed" only with a reason.',
    inputSchema: object(
      {
        feedbackId: id('The note.'),
        status: { type: 'string', enum: ['review', 'dismissed'] },
        summary: { type: 'string', minLength: 1, maxLength: 600 },
      },
      ['feedbackId', 'status', 'summary'],
    ),
    annotations: { ...write, idempotentHint: true },
    run: async (args, c) => {
      const status = str(args, 'status') as FeedbackStatus;
      if (status !== 'review' && status !== 'dismissed')
        throw new HttpError(400, 'status must be review or dismissed');
      const row = await setFeedback(c.db, c.user.id, uuid(args, 'feedbackId'), {
        status,
        resolution: str(args, 'summary'),
      });
      return { feedbackId: row.id, status: row.status };
    },
  },
];

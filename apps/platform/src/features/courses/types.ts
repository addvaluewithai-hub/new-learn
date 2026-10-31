export type CourseLessonInfo = {
  id: string;
  title: string;
  position: number;
  goals: Array<{ id: string; text: string }>;
  scenes: number;
};
export type PublicCourse = {
  id: string;
  title: string;
  subject: string;
  description: string;
  language: string;
  teacher: string;
  version: number;
  /** 0 is free; a paid course is studied once bought (docs/credits.md). */
  priceCents: number;
  currency: string;
  /** Whether the signed-in person may study it now. */
  access: boolean;
  publishedAt: string;
  parts: Array<{ title: string; lessonIds: string[] }>;
  lessons: CourseLessonInfo[];
};
export type MyLesson = {
  id: string;
  title: string;
  position: number;
  status: 'new' | 'started' | 'completed';
  updatedAt: string | null;
};
export type MyCourse = {
  id: string;
  title: string;
  subject: string;
  description: string;
  teacher: string;
  lessons: MyLesson[];
};
export const courseHref = (courseId: string) => `/?course=${courseId}`;
export const courseLessonHref = (courseId: string, lessonId: string) =>
  `/?course=${courseId}&lesson=${lessonId}`;

export type LessonProgress = {
  status: 'started' | 'completed';
  goalsDone: number;
  goalsTotal: number;
  updatedAt: string;
};
export type CatalogLesson = {
  id: string;
  title: string;
  subtitle: string;
  position: number;
  availability: 'review' | 'published' | 'coming-soon';
  progress?: LessonProgress;
};
export type Curriculum = {
  id: string;
  title: string;
  description: string;
  subject: string;
  lessons: CatalogLesson[];
};
export type Resume = { curriculumId: string; lessonId: string; kind: 'continue' | 'next' };
export type Catalog = { curricula: Curriculum[]; resume?: Resume | null };

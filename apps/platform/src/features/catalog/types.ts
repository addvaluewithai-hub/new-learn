export type CatalogLesson = {
  id: string;
  title: string;
  subtitle: string;
  position: number;
  availability: 'review' | 'published' | 'coming-soon';
};
export type Curriculum = {
  id: string;
  title: string;
  description: string;
  subject: string;
  lessons: CatalogLesson[];
};

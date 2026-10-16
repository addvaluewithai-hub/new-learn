import type { LessonContext } from '@learn/lesson-runtime';
import { BookReference } from './BookReference';
import { referencePart as reference9 } from '../../../../../content/book-guided/physics-ch09/reference';
const chapter8 = (context: LessonContext | null) => <BookReference context={context} />;
const chapter9 = (context: LessonContext | null) => (
  <BookReference context={context} resolve={reference9} assetBase="/book-ch09" />
);
export const bookReference = (lessonId: string) =>
  lessonId === 'phys1-textbook-ch08'
    ? chapter8
    : lessonId === 'phys1-textbook-ch09'
      ? chapter9
      : undefined;

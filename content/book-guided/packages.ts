import { publishedLesson } from './published';
export const bookReadingPackages = {
  'book-reading:phys1-textbook-ch08': async () => ({
    default: publishedLesson((await import('./physics-ch08/reading/package')).readingLesson),
  }),
  'book-reading:phys1-textbook-ch09': async () => ({
    default: publishedLesson((await import('./physics-ch09/reading/package')).readingLesson),
  }),
};

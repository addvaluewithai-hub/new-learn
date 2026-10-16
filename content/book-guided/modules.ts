import { publishedLesson } from './published';
export const bookReadingModules = {
  'book-reading:phys1-textbook-ch08': async () => {
    const module = await import('./physics-ch08/reading/client');
    return { ...module, readingLesson: publishedLesson(module.readingLesson) };
  },
  'book-reading:phys1-textbook-ch09': async () => {
    const module = await import('./physics-ch09/reading/client');
    return { ...module, readingLesson: publishedLesson(module.readingLesson) };
  },
};

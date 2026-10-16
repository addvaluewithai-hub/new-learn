import type { RendererRegistry } from '@learn/lesson-runtime';
import BookBoard from '../board/BookBoard';
import { BOOK_RENDERER } from './package';
export { readingLesson } from './package';
export const readingRenderers: RendererRegistry = { [BOOK_RENDERER]: BookBoard };

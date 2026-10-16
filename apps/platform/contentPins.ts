import imported from './content-modules.json';
import { bookPins } from '../../content/book-guided/published';
export const contentPins = { ...imported, ...bookPins };

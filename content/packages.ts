import { readingPackages as imported } from './imported/packages';
import { bookReadingPackages } from './book-guided/packages';
export const readingPackages = { ...imported, ...bookReadingPackages };

import imported from './imported/registry.json';
import books from './book-guided/release.json';
/** Imported curricula and the reviewed textbook experiment share the catalog contract. */
export const registry = { curricula: [...imported.curricula, ...books.curricula] };

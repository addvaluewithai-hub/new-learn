import type { VisualProps } from '@learn/lesson-runtime';
import BookBoardView from '../../physics-ch08/board/BookBoard';
import './book-board.css';
import { bookParts, sourceById } from '../index';
const headings = Object.fromEntries(bookParts.map((p) => [p.id, { title: p.title, words: [] }]));
export default function BookBoard(props: VisualProps) {
  return <BookBoardView {...props} chapter={9} sources={sourceById} headings={headings} />;
}

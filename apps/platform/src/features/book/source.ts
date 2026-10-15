import type { PDFDocumentProxy } from 'pdfjs-dist';

export type BookSources = { main?: PDFDocumentProxy; closeup?: PDFDocumentProxy };
export type SourceKind = keyof BookSources;
export type Focus = [number, number, number, number];
export const sourceHashes: Record<string, SourceKind> = {
  cd8b27872a259b3d83151189b201ada71202699dc5a3f3eeef05ab02502ac494: 'main',
  e89b1514b08c47e24742f9e1a5aff42e4707477faf5ed7912c53258f194e27df: 'closeup',
};
const focus: Record<string, [number, number]> = {
  'P122-A': [0.13, 0.28],
  'P122-B': [0.36, 0.58],
  'P122-C': [0.49, 0.18],
  'P123-B': [0.17, 0.3],
  'P123-C': [0.4, 0.56],
  'P124-A': [0.03, 0.22],
  'P124-B': [0.24, 0.22],
  'P124-C': [0.4, 0.53],
  'P125-A': [0.04, 0.19],
  'P125-B': [0.22, 0.43],
  'P125-C': [0.67, 0.29],
  'P126-A': [0.03, 0.39],
  'P126-B': [0.42, 0.26],
  'P126-C': [0.69, 0.26],
  'P127-A': [0.03, 0.23],
  'P127-B': [0.26, 0.18],
  'P127-C': [0.46, 0.17],
  'P127-D': [0.63, 0.32],
  'P128-A': [0.03, 0.49],
  'P128-B': [0.52, 0.27],
  'P128-C': [0.79, 0.17],
  'P129-A': [0.03, 0.22],
  'P129-B': [0.25, 0.63],
};

export function sourcePosition(page: number, id: string, sources: BookSources) {
  const closeup = (page === 124 || page === 125) && Boolean(sources.closeup);
  const kind: SourceKind = closeup ? 'closeup' : 'main';
  const single = page === 121;
  const left = page % 2 === 0;
  const crop: Focus = single ? [0, 0, 1, 1] : left ? [0, 0, 0.54, 1] : [0.48, 0, 0.52, 1];
  const y = focus[id];
  return {
    document: sources[kind],
    pdfPage: closeup ? 1 : single ? 5 : 6 + Math.floor((page - 122) / 2),
    rotation: closeup || single ? 0 : 270,
    crop,
    focus: (y ? [0.09, y[0], 0.83, y[1]] : [0.06, 0.04, 0.88, 0.88]) as Focus,
  };
}

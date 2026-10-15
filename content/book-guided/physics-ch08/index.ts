import metadata from './metadata.json';
import p121 from './pages/121.json';
import p122 from './pages/122.json';
import p123 from './pages/123.json';
import p124 from './pages/124.json';
import p125 from './pages/125.json';
import p126 from './pages/126.json';
import p127 from './pages/127.json';
import p128 from './pages/128.json';
import p129 from './pages/129.json';
import p130 from './pages/130.json';
import p131 from './pages/131.json';
import p132 from './pages/132.json';
import p133 from './pages/133.json';

export type BookSection = {
  id: string;
  page: number;
  title: string;
  question: boolean;
  blocks: string[];
  solution: string[];
  notes: string[];
};
export const bookMetadata = metadata;
export const bookSections: BookSection[] = [
  ...p121,
  ...p122,
  ...p123,
  ...p124,
  ...p125,
  ...p126,
  ...p127,
  ...p128,
  ...p129,
  ...p130,
  ...p131,
  ...p132,
  ...p133,
];

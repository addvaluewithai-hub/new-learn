import { BookOpenIcon } from '@phosphor-icons/react/dist/csr/BookOpen';
import { NotebookIcon } from '@phosphor-icons/react/dist/csr/Notebook';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { LightbulbIcon } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { PathIcon } from '@phosphor-icons/react/dist/csr/Path';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play';

const icons = {
  book: BookOpenIcon,
  source: NotebookIcon,
  notes: PencilSimpleIcon,
  guide: LightbulbIcon,
  map: PathIcon,
  close: XIcon,
  play: PlayIcon,
};
export function ClassroomIcon({ name, size = 22 }: { name: keyof typeof icons; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} weight="regular" aria-hidden="true" />;
}

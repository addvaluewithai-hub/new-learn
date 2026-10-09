import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { SparkleIcon } from '@phosphor-icons/react/dist/csr/Sparkle';
import { LockKeyIcon } from '@phosphor-icons/react/dist/csr/LockKey';
import { BooksIcon } from '@phosphor-icons/react/dist/csr/Books';
import { SignOutIcon } from '@phosphor-icons/react/dist/csr/SignOut';
import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
const icons = {
  arrow: ArrowLeftIcon,
  spark: SparkleIcon,
  lock: LockKeyIcon,
  books: BooksIcon,
  logout: SignOutIcon,
  menu: ListIcon,
  close: XIcon,
};
export function PlatformIcon({ name }: { name: keyof typeof icons }) {
  const Icon = icons[name];
  return <Icon size={22} aria-hidden="true" />;
}

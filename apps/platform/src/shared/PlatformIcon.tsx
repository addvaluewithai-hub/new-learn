import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { SparkleIcon } from '@phosphor-icons/react/dist/csr/Sparkle';
import { LockKeyIcon } from '@phosphor-icons/react/dist/csr/LockKey';
import { BooksIcon } from '@phosphor-icons/react/dist/csr/Books';
import { SignOutIcon } from '@phosphor-icons/react/dist/csr/SignOut';
import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { GearSixIcon } from '@phosphor-icons/react/dist/csr/GearSix';
import { ChalkboardTeacherIcon } from '@phosphor-icons/react/dist/csr/ChalkboardTeacher';
import { CoinsIcon } from '@phosphor-icons/react/dist/csr/Coins';
import { SealCheckIcon } from '@phosphor-icons/react/dist/csr/SealCheck';
import { PulseIcon } from '@phosphor-icons/react/dist/csr/Pulse';
import { CompassIcon } from '@phosphor-icons/react/dist/csr/Compass';
import { useI18n } from '../i18n';
const icons = {
  arrow: ArrowLeftIcon,
  spark: SparkleIcon,
  lock: LockKeyIcon,
  books: BooksIcon,
  logout: SignOutIcon,
  menu: ListIcon,
  close: XIcon,
  settings: GearSixIcon,
  teach: ChalkboardTeacherIcon,
  credits: CoinsIcon,
  review: SealCheckIcon,
  ops: PulseIcon,
  explore: CompassIcon,
};
export function PlatformIcon({ name }: { name: keyof typeof icons }) {
  const Icon = icons[name];
  const { dir } = useI18n();
  // The arrow points forward: left in right-to-left languages, right otherwise.
  return <Icon size={22} aria-hidden="true" mirrored={name === 'arrow' && dir === 'ltr'} />;
}

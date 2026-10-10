import { ChatCircleDotsIcon } from '@phosphor-icons/react/dist/csr/ChatCircleDots';
import { PhoneIcon } from '@phosphor-icons/react/dist/csr/Phone';
import { MicrophoneIcon } from '@phosphor-icons/react/dist/csr/Microphone';
import { MicrophoneSlashIcon } from '@phosphor-icons/react/dist/csr/MicrophoneSlash';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { PaperPlaneRightIcon } from '@phosphor-icons/react/dist/csr/PaperPlaneRight';
import { PauseIcon } from '@phosphor-icons/react/dist/csr/Pause';
const icons = {
  chat: ChatCircleDotsIcon,
  voice: PhoneIcon,
  mic: MicrophoneIcon,
  muted: MicrophoneSlashIcon,
  close: XIcon,
  send: PaperPlaneRightIcon,
  pause: PauseIcon,
};
export function NovaIcon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} aria-hidden="true" />;
}

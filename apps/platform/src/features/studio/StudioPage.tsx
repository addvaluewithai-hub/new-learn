import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { StudioForm } from './StudioForm';
import { BuildProgress } from './BuildProgress';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import '../catalog/library-account.css';
import './studio.css';

/** "Make a course": the teacher's request, then the builder's progress (docs/voice-agent.md, Y6). */
export default function StudioPage({
  user,
  onSignOut,
  jobId,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  jobId: string | null;
}) {
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="studio">
      {jobId ? <BuildProgress key={jobId} jobId={jobId} /> : <StudioForm />}
    </LibraryShell>
  );
}

import { Classroom } from '../features/classroom/Classroom';
import { probeLesson } from '../../../../fixtures/runtime-probe/lesson';
import { probeRenderers } from '../../../../fixtures/runtime-probe/renderers';

export default function DevelopmentLesson() {
  return <Classroom lesson={probeLesson} registry={probeRenderers} />;
}

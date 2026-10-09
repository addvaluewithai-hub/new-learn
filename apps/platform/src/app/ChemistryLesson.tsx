import { Classroom } from '../features/classroom/Classroom';
import '@learn/lesson-runtime/style.css';
import { statesLesson, statesRenderers } from '../../../../content/chemistry/states-of-matter';

export default function ChemistryLesson() {
  return <Classroom lesson={statesLesson} registry={statesRenderers} realContent />;
}

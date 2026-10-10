import { useCallback, useState } from 'react';
import type { LessonContext, LessonController } from '@learn/lesson-runtime';
import { NovaAssistant } from '../nova/NovaAssistant';
import { LessonPreview } from '@learn/lesson-runtime';
import type { LessonPackage, RendererRegistry } from '@learn/lesson-runtime';
import { ClassroomHeader } from './ClassroomHeader';
import { ClassroomIcon } from './ClassroomIcon';
import { LessonGuide } from './LessonGuide';
import { LessonTools, type GuideTool } from './LessonTools';
import './classroom.css';
import './lesson-chrome.css';

export function Classroom({
  lesson,
  registry,
  realContent = false,
  backHref,
  studentName,
}: {
  lesson: LessonPackage;
  registry: RendererRegistry;
  realContent?: boolean;
  backHref?: string;
  studentName?: string;
}) {
  const [context, setContext] = useState<LessonContext | null>(null);
  const [controller, setController] = useState<LessonController | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const onReady = useCallback((value: LessonController | null) => setController(value), []);
  const [tool, setTool] = useState<GuideTool | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [notes, setNotes] = useState('');
  function openTool(next: GuideTool) {
    setTool((current) => (current === next ? null : next));
  }
  if (!realContent)
    return (
      <main className="probe-classroom">
        <h1>نشرح فكرة، نجربها، ونكمل.</h1>
        <p>اختبار المحرك بالنغمات التجريبية، وليس درسًا معتمدًا.</p>
        <LessonPreview lesson={lesson} registry={registry} />
      </main>
    );
  return (
    <div className="classroom-shell">
      <ClassroomHeader
        lesson={lesson}
        backHref={backHref}
        onMap={() => setShowMap((value) => !value)}
        onSource={() => openTool('source')}
        onHelp={() => openTool('guide')}
      />
      <main className="classroom" dir="rtl">
        <div className="classroom-breadcrumb" dir="ltr">
          <div>
            <span>{lesson.curriculumTitle}</span>
            <h1>
              {lesson.title}
              <small lang="en" dir="ltr">
                {lesson.englishTitle}
              </small>
            </h1>
          </div>
          <span className="classroom-mode">
            <ClassroomIcon name="play" size={18} />
            مساحة الدرس
          </span>
        </div>
        <div
          className={`classroom-workspace ${tool ? 'has-guide' : ''} ${showMap ? 'show-scenes' : ''}`}
          dir="ltr"
        >
          <div id="classroom-player" className="classroom-player">
            <LessonPreview
              lesson={lesson}
              registry={registry}
              suspended={assistantOpen}
              onReady={onReady}
              onContext={setContext}
            />
          </div>
          {tool && (
            <LessonGuide
              lesson={lesson}
              tool={tool}
              notes={notes}
              onNotes={setNotes}
              onClose={() => setTool(null)}
              onTerms={() => setTool('terms')}
            />
          )}
        </div>
        <LessonTools
          active={tool}
          onTool={openTool}
          onMap={() => setShowMap((value) => !value)}
          showMap={showMap}
        />
        <NovaAssistant
          lesson={lesson}
          studentName={studentName}
          context={context}
          controller={controller}
          onOpen={setAssistantOpen}
        />
        <p className="classroom-footer">
          نسخة للمراجعة · الصوت الأصلي · تقدم وملاحظات الجلسة الحالية فقط
        </p>
      </main>
    </div>
  );
}

import { useCallback, useState } from 'react';
import type { LessonContext, LessonController } from '@learn/lesson-runtime';
import { NovaAssistant } from '../nova/NovaAssistant';
import { LessonPreview } from '@learn/lesson-runtime';
import type { LessonPackage, RendererRegistry } from '@learn/lesson-runtime';
import { ClassroomHeader } from './ClassroomHeader';
import { LessonGuide } from './LessonGuide';
import { LessonTools, type GuideTool } from './LessonTools';
import { useI18n } from '../../i18n';
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
  const { t, dir } = useI18n();
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
        <h1>{t('classroom.probe.title')}</h1>
        <p>{t('classroom.probe.lead')}</p>
        <LessonPreview lesson={lesson} registry={registry} />
      </main>
    );
  return (
    <div className="classroom-shell">
      <ClassroomHeader lesson={lesson} backHref={backHref} onHelp={() => openTool('guide')} />
      <main className="classroom" dir={dir}>
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
          {backHref ? (
            <a className="classroom-mode" href={backHref} dir={dir}>
              {t('classroom.backToCurriculum', { back: t('common.back') })}
            </a>
          ) : null}
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
        <p className="classroom-footer">{t('classroom.footer')}</p>
      </main>
    </div>
  );
}

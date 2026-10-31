// Codex's JSON events, turned into the short lines a teacher sees while the course is made.
// A line is a step key, `step:<id>` or `step:<id>:<title>`: the studio shows it in the
// teacher's language from build.steps.<id> in the language files, `{title}` filled in.
const TOOLS = {
  get_authoring_guide: 'readGuide',
  get_style: 'readStyle',
  list_my_courses: 'listCourses',
  create_course: 'createCourse',
  update_course: 'arrangeCourse',
  add_lesson: 'writeLesson',
  update_lesson: 'editLesson',
  get_lesson: 'readLesson',
  put_board: 'makeBoard',
  get_board: 'readBoard',
  get_feedback: 'readFeedback',
  resolve_feedback: 'resolveFeedback',
};

const READS = new Set(['Read', 'Glob', 'Grep']);

/** The step line for an id, with the lesson's title when there is one. */
export const step = (id, title) => (title === undefined ? `step:${id}` : `step:${id}:${title}`);

/** The teacher's line for one tool call, by tool name and arguments; null when not shown. */
export function labelFor(tool, args) {
  if (TOOLS[tool]) {
    const title = args?.lesson?.title;
    return tool === 'add_lesson' && typeof title === 'string'
      ? step('writeLessonNamed', title)
      : step(TOOLS[tool]);
  }
  if (tool === 'WebSearch' || tool === 'WebFetch') return step('webSearch');
  if (READS.has(tool)) return step('readFiles');
  return null;
}

/** The line after a tool call failed: fixing the lesson, or trying again. */
export const failedStep = (tool) => step(tool === 'add_lesson' ? 'fixLesson' : 'retry');

/** The line for a Codex event's item as it starts, or null for events the teacher need not see. */
export function stepFor(item) {
  if (!item) return null;
  if (item.type === 'mcp_tool_call') return labelFor(item.tool, item.arguments) ?? step('working');
  if (item.type === 'web_search') return step('webSearch');
  if (item.type === 'command_execution') return step('readFiles');
  return null;
}

/** Reads one JSON event into the run's state, calling onStep for each new visible line. */
export function consume(event, state, onStep) {
  if (event.type === 'thread.started' && event.thread_id) state.threadId = event.thread_id;
  const item = event.item;
  if (event.type === 'item.started') {
    const line = stepFor(item);
    if (line && line !== state.lastStep) {
      state.lastStep = line;
      onStep(line);
    }
  }
  if (event.type === 'item.completed' && item?.type === 'mcp_tool_call' && item.status === 'failed')
    onStep(failedStep(item.tool));
  if (event.type === 'item.completed' && item?.type === 'agent_message' && item.text)
    state.finalText = item.text;
  if (event.type === 'turn.failed' || event.type === 'error')
    state.failure = event.error?.message || event.message || 'Codex run failed';
}

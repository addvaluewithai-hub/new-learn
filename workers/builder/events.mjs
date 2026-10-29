// Codex's JSON events, turned into the short lines a teacher sees while the course is made.
const TOOLS = {
  get_authoring_guide: 'بقرا دليل الكتابة',
  get_style: 'بقرا دليل الشكل',
  list_my_courses: 'براجع كورساتك',
  create_course: 'بعمل الكورس',
  update_course: 'بنظّم أجزاء الكورس',
  add_lesson: 'بكتب درس',
  update_lesson: 'بصلّح الدرس',
  get_lesson: 'براجع الدرس',
  put_board: 'بعمل بورد تفاعلي',
  get_board: 'براجع البورد',
  get_feedback: 'بقرا الملاحظات',
  resolve_feedback: 'بقفل ملاحظة',
};

const READS = new Set(['Read', 'Glob', 'Grep']);

/** The teacher's line for one tool call, by tool name and arguments; null when not shown. */
export function labelFor(tool, args) {
  if (TOOLS[tool]) {
    const title = args?.lesson?.title;
    return tool === 'add_lesson' && typeof title === 'string'
      ? `${TOOLS[tool]}: ${title}`
      : TOOLS[tool];
  }
  if (tool === 'WebSearch' || tool === 'WebFetch') return 'بدوّر على النت';
  if (READS.has(tool)) return 'بقرا ملفاتك';
  return null;
}

/** The line for a Codex event's item as it starts, or null for events the teacher need not see. */
export function stepFor(item) {
  if (!item) return null;
  if (item.type === 'mcp_tool_call')
    return labelFor(item.tool, item.arguments) ?? 'بشتغل على الكورس';
  if (item.type === 'web_search') return 'بدوّر على النت';
  if (item.type === 'command_execution') return 'بقرا ملفاتك';
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
    onStep(item.tool === 'add_lesson' ? 'بصلّح مشاكل في الدرس' : 'بعيد المحاولة');
  if (event.type === 'item.completed' && item?.type === 'agent_message' && item.text)
    state.finalText = item.text;
  if (event.type === 'turn.failed' || event.type === 'error')
    state.failure = event.error?.message || event.message || 'Codex run failed';
}

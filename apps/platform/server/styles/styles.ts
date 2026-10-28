import { HttpError } from '../http';
import { LOOKS } from '../builds/looks';
import generated from './styles.generated.json';

// Each look's style guide (docs/visuals/styles) with its reference demo board, bundled by
// tools/style-guides.mjs, for the get_style MCP tool and the builder.
type Style = { guide: string; boardId: string; files: Record<string, string> };
const STYLES = (generated as { looks: Record<string, Style> }).looks;

/** One look's guide and reference board; without a look, the looks to choose from. */
export function styleFor(look: string | undefined) {
  if (!look)
    return {
      looks: Object.keys(STYLES).map((id) => ({ id, summary: `${LOOKS[id]?.split('.')[0]}.` })),
      next: 'Choose the look that suits the topic, then call get_style with it.',
    };
  const style = STYLES[look];
  if (!style)
    throw new HttpError(400, `Unknown look "${look}". Looks: ${Object.keys(STYLES).join(', ')}.`);
  return {
    look,
    guide: style.guide,
    referenceBoard: {
      boardId: style.boardId,
      files: style.files,
      note:
        'A working board in this look. Start new boards from its structure and technique, with ' +
        'your own id, variables and drawing for the lesson; never upload it unchanged.',
    },
  };
}

export const STYLE_IDS = Object.keys(STYLES);

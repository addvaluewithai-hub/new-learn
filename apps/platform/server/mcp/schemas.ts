// JSON Schemas of the connector's tool inputs. The server validates everything again; these
// tell the model what to send.

const text = { type: 'string', minLength: 1 };
const boardState = {
  type: 'object',
  description: 'How the board looks once this step is reached (docs in get_authoring_guide).',
  properties: {
    state: { type: 'object', additionalProperties: { type: ['number', 'string'] } },
    highlight: { type: 'array', items: { type: 'string', pattern: '^#' } },
    reveal: { type: 'array', items: { type: 'string', pattern: '^#' } },
    notes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { target: { type: 'string' }, text: { type: 'string' } },
        required: ['target', 'text'],
      },
    },
    input: { type: 'string', enum: ['locked', 'open'] },
  },
};
const step = {
  type: 'object',
  properties: { text: { ...text, maxLength: 800 }, board: boardState },
  required: ['text'],
};
const check = {
  type: 'object',
  description:
    'number: {variable, kind:"number", target, tolerance}; choice: {variable, kind:"choice", value}; set: {kind:"set", checks:[...]}',
};

export const lessonSchema = {
  type: 'object',
  description: 'A whole lesson. Scenes in order; each scene teaches one idea in short steps.',
  properties: {
    title: { ...text, maxLength: 120 },
    englishTitle: { type: 'string' },
    scenes: {
      type: 'array',
      minItems: 1,
      maxItems: 40,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,39}$' },
          title: { ...text, maxLength: 120 },
          board: { type: 'string', description: 'Id of a board uploaded with put_board.' },
          steps: { type: 'array', minItems: 1, maxItems: 20, items: step },
          question: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['choice', 'written', 'choice-and-written', 'board'] },
              english: { type: 'string' },
              arabic: { type: 'string' },
              options: { type: 'array', maxItems: 6, items: { type: 'string' } },
              answer: {
                type: 'object',
                properties: { english: { type: 'string' }, arabic: { type: 'string' } },
              },
              board: {
                type: 'object',
                properties: { state: { type: 'object' }, check },
                required: ['check'],
              },
              feedback: { type: 'array', minItems: 1, items: step },
            },
            required: ['kind', 'answer', 'feedback'],
          },
        },
        required: ['id', 'title', 'steps'],
      },
    },
    goals: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text, sceneIds: { type: 'array', items: { type: 'string' } } },
        required: ['text', 'sceneIds'],
      },
    },
    glossary: {
      type: 'array',
      items: {
        type: 'object',
        properties: { term: text, meaning: text },
        required: ['term', 'meaning'],
      },
    },
  },
  required: ['title', 'scenes'],
};

export const id = (description: string) => ({ type: 'string', format: 'uuid', description });
export const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
export const courseFields = {
  title: { ...text, maxLength: 120 },
  subject: { type: 'string', maxLength: 80 },
  description: { type: 'string', maxLength: 600 },
  language: { type: 'string', description: 'Language code of the lessons, e.g. ar or en.' },
};
export const filesSchema = {
  type: 'object',
  description:
    'Board files, path -> text content: board.json, index.html, and optional .js/.css/.json/.svg files.',
  additionalProperties: { type: 'string' },
};

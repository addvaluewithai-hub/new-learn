# Arabic calligraphy and ink (`calligraphy`)

Calm black ink and large naskh on warm paper, with red and blue marking roles: for Arabic
grammar, spelling, poetry and Quran-style text, where the words themselves are the picture.

## Reference board

`demo-grammar-ink` in `fixtures/demos/boards/grammar-ink/` (`board.json`, `index.html`,
`ink.js`). «كَتَبَ الطالبُ الدرسَ» in large naskh with tags under each word, a meaning line,
and an ink drawing of who writes on whom. Variables: `doer` (`student` | `lesson`) swaps the
case endings and the picture; `order` (`vso` | `vos`) swaps the nouns but not the meaning.
Targets: `#sentence`, `#meaning`, `#picture`, `#doer-choice`, `#order-choice`, `#key`.
`libraries: ["amiri@5.3.0"]`. `get_style` returns these files: start a new board from their
structure (words built as DOM in `index.html`, the SVG drawing in its own classic script).

## Palette

| Role                                        | Hex       |
| ------------------------------------------- | --------- |
| Paper (body)                                | `#f6efe2` |
| `--nl-backdrop`                             | `#ece2cf` |
| Ink: text, strokes, borders, pressed button | `#1e1a16` |
| Red: doer ending and tag, pen nib, arrow    | `#b23a2a` |
| Blue: done-to ending and tag                | `#2a5ab2` |
| Muted brown: verb tag                       | `#6b5a48` |
| Light paper: buttons, notebook fill         | `#fbf6ea` |

The paper has two faint ink blots: `radial-gradient`s of `rgb(30 26 22 / 6%)` at 20% 30% and
`/ 7%` at 70% 75%, over `#f6efe2`. Red and blue mean the two roles everywhere: in the ending,
its tag, and the key in the panel.

## Type

- Display Arabic: `font-family: 'NL Naskh', serif` (Amiri, served by the helper from
  `amiri@5.3.0`), weight 700, 104px landscape / 88px portrait, `line-height: 1.5` so the
  harakat above and below are not clipped.
- Everything else is NL Sans: title 42/600, tags 26/600 (pill: 3px `currentColor` border,
  `border-radius: 999px`), meaning 32/600, key 26 with line-height 1.45, buttons 26/600.
  Portrait raises tags, key and buttons to 32 and the meaning to 34.
- Harakat are typed in the text (`'كَتَبَ'`). The case ending is the last letter plus its mark
  in its own `<span class="end doer|done">` inside the same `<b>`, so only it changes colour
  and the word stays one run. A mark shown alone sits on a tatweel: `( ـُ )`, `( ـَ )`.

```js
const WORDS = {
  verb: ['كَتَبَ', ''],
  student: ['الطال', { doer: 'بُ', done: 'بَ' }],
  lesson: ['الدر', { doer: 'سُ', done: 'سَ' }],
};
const [stem, ends] = WORDS[key];
b.append(stem);
const end = document.createElement('span');
end.className = `end ${role}`; // .end.doer red, .end.done blue
end.textContent = ends[role];
```

## Drawing technique

Text is HTML (a flex row of `.word` columns: the word, then its tag), rebuilt with
`replaceChildren` on each state. The flex row follows `dir="rtl"`, so the verb is rightmost.
The picture is an inline `<svg id="picture" viewBox="0 0 760 300">` whose `innerHTML` is set
from `pictureSvg(doer)`: simple line figures (a stick student, a lined notebook, a pen) built
by small functions with `translate(x y) scale(s)`, ink stroke 5px, round caps, paper fills.
The doer stands on the right (read first) and a red dashed arrow (`stroke-dasharray="14 10"`)
runs to the one written on. All of it sits under one mild ink-bleed filter with a fixed seed;
there is no randomness, so the picture depends only on `doer`:

```svg
<filter id="bleed"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2"
  seed="7"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
<g filter="url(#bleed)"> ...figures, pen, arrow... </g>
```

## Layout

Landscape 1280×720: `.page` (860×720) on the left holds the sentence (top 56, 34px gaps),
the meaning (top 330) and the picture (760×300 at 50, 400). A 420px panel on the right
(padding 36/34, 14px gaps) holds the title, the colour key and two rows of choices; a 3px
solid ink line divides them (`border-inline-end`, on the left because the page is RTL).
Portrait 720×1280: `.page` becomes 720×660 (sentence top 30, 18px gaps; meaning top 280;
picture 720×284 at top 360), and the panel moves to `top: 660px`, 720×620, ink line on top.
All of it is CSS on `[data-layout='portrait']`; nothing is scaled with `transform`.

## Controls and states

Each choice variable is a `.choices` row of `<button>`s (flex 1, `min-height: 96px`, 3px ink
border, radius 10, `#fbf6ea`), rebuilt each state with `aria-pressed` on the current value,
which inverts to ink with `#f6efe2` text; `onclick` calls `NewLearnBoard.setVariables`.
Highlight, reveal and notes are the helper's own: a 4px `#e0a526` outline, `[data-reveal]`
hidden until revealed (unused here), and a `#fff8e1` note at 32px. Highlight a whole word
group (`#sentence`) or the key, not a letter.

## Motion

None in the reference: each state rebuilds the words and sets the SVG at once, so a choice
flips the endings instantly and reduced motion is already the end picture. If a lesson step
(`view.step` changed) animates, use CSS only (the helper disables it under
`[data-reduced-motion]`) and finish on the state's picture.

## Do and don't

- Do make the Arabic the hero: one sentence or verse, 88–104px naskh, lots of paper around it.
- Do write the full harakat in the strings and keep `line-height` ≥ 1.5 on naskh.
- Do colour a grammatical role the same everywhere (ending, tag, key), with red and blue only.
- Do keep the drawing to a few ink line figures, 5px strokes, under the one bleed filter.
- Do put explanations in NL Sans and only display Arabic in NL Naskh.
- Don't split a word into separate boxes or add spacing inside it; colour the ending in a span.
- Don't draw Arabic as SVG `<text>` or images; keep it HTML so shaping and the check work.
- Don't add bright fills, gradients on shapes, or a third accent colour.

## Before put_board

- `npm run board:check -- <folder>` passes: landscape and portrait, Arabic and English.
- Text ≥ 24px landscape and ≥ 32px portrait (tags, key and buttons go up to 32 in portrait).
- Buttons `min-height: 96px`; the naskh line is not clipped at the top or bottom.
- Same state ⇒ same words and SVG: values normalised first, filter seed fixed, no random.
- `libraries: ["amiri@5.3.0"]` as in the reference; classic `<script src>`, no modules.

// Runs inside a board (through Playwright) after a state is drawn, and lists what breaks the
// canvas rules in docs/boards.md. Self-contained: it is serialized into the board's page.
export function inspectCanvas({ minText, minControl, edge }) {
  const problems = [];
  const c = NewLearnBoard.canvas;
  const local = (r) => ({
    left: (r.left - c.x) / c.scale,
    top: (r.top - c.y) / c.scale,
    right: (r.right - c.x) / c.scale,
    bottom: (r.bottom - c.y) / c.scale,
    width: r.width / c.scale,
    height: r.height / c.scale,
  });
  const box = (r) =>
    `${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}`;
  const name = (el) => {
    if (el.id) return `#${el.id}`;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`;
  };
  const add = (check, el, detail) => problems.push({ check, element: name(el), detail });
  const shown = (el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
  };
  const scroller = (el) => el.parentElement?.closest('[data-scroll]');
  const CONTROL =
    'input:not([type=hidden]), select, button, textarea, [role=button], [role=slider], a[href]';
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'OPTION', 'TITLE'].includes(el.tagName)) continue;
    if (!shown(el) || scroller(el)) continue;
    const inSvg = el.closest('svg') && el.tagName.toLowerCase() !== 'svg';
    if (inSvg && el.tagName.toLowerCase() !== 'text') continue;
    const r = local(el.getBoundingClientRect());
    if (!r.width && !r.height) continue;
    const outside = r.left < -1 || r.top < -1 || r.right > c.width + 1 || r.bottom > c.height + 1;
    if (outside) add('inside-canvas', el, `box ${box(r)} leaves the ${c.width}×${c.height} canvas`);
    const s = getComputedStyle(el);
    const clips = [s.overflowX, s.overflowY].some((v) => v !== 'visible');
    if (clips && !el.matches('[data-scroll]'))
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        add('text-overflow', el, 'its content is cut off inside its own box');
    if (el.matches(CONTROL) && Math.min(r.width, r.height) < minControl)
      add(
        'control-size',
        el,
        `${Math.round(r.width)}×${Math.round(r.height)}, needs ${minControl}`,
      );
    const texts = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!texts.length) continue;
    const size = inSvg ? r.height : parseFloat(s.fontSize);
    if (size < minText - 0.5)
      add('text-size', el, `${Math.round(size)}px text, needs at least ${minText}px`);
    const family = s.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    if (family !== 'nl sans' && family !== 'nl naskh' && !family.startsWith('katex'))
      add('font', el, `uses "${family}", boards use the board fonts (NL Sans, NL Naskh) or KaTeX`);
    for (const node of texts) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const t = local(range.getBoundingClientRect());
      const near = t.left < edge || t.top < edge || t.right > c.width - edge;
      if (outside) continue;
      if (near || t.bottom > c.height - edge)
        add('text-edge', el, `text at ${box(t)} is closer than ${edge}px to the canvas edge`);
      else if (
        // An inline element's box is its text; only blocks can be too small for their text.
        !inSvg &&
        !s.display.startsWith('inline') &&
        // Arabic fonts measure taller than their line, so height gets a third of an em.
        (t.right > r.right + 1 ||
          t.left < r.left - 1 ||
          t.bottom > r.bottom + parseFloat(s.fontSize) / 3)
      )
        add('text-overflow', el, 'its text spills out of its box');
    }
  }
  return problems;
}

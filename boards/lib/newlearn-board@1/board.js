// New Learn board helper, protocol v1 (docs/boards.md). Served from the board origin only.
// The board draws on a fixed canvas (body): 1280×720 landscape or 720×1280 portrait. This
// helper scales the whole canvas to fit the frame, so what fits once fits on every screen.
// A board calls NewLearnBoard.start({ onState(view, env) { ...draw... } }) once, then
// NewLearnBoard.setVariables({...}) when the learner changes something and
// NewLearnBoard.observe('one sentence', details) to tell the tutor what the board shows.
(() => {
  const CANVAS = { landscape: [1280, 720], portrait: [720, 1280] };
  const FONT = '/lib/ibm-plex-sans-arabic@1.0.0';
  const ARABIC = 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF';
  const face = (weight, subset, range) =>
    `@font-face { font-family: 'NL Sans'; font-weight: ${weight}; font-display: block;
      src: url('${FONT}/ibm-plex-sans-arabic-${subset}-${weight}-normal.woff2') format('woff2');
      ${range ? `unicode-range: ${range};` : ''} }`;
  const post = (message) => parent.postMessage({ nl: 1, ...message }, '*');
  let env = null;
  let handlers = null;
  let view = null;
  let announced = false;
  let canvas = { layout: 'landscape', width: 1280, height: 720, scale: 1, x: 0, y: 0 };

  const style = document.createElement('style');
  style.textContent = `
    ${face(400, 'arabic', ARABIC)} ${face(600, 'arabic', ARABIC)}
    ${face(400, 'latin')} ${face(600, 'latin')}
    html { height: 100%; overflow: hidden; background: var(--nl-backdrop, #0d1626); }
    body { position: absolute; inset: 0 auto auto 0; margin: 0; overflow: hidden;
      box-sizing: border-box; transform-origin: 0 0;
      font: 32px/1.4 'NL Sans', sans-serif; }
    button, input, select, textarea { font: inherit; }
    [data-scroll] { overflow: auto; }
    .nl-highlight { outline: 4px solid #e0a526; outline-offset: 6px; border-radius: 8px; }
    [data-reveal]:not(.nl-revealed) { visibility: hidden; }
    .nl-note { position: absolute; z-index: 10; max-width: 420px; padding: 10px 16px;
      border-radius: 14px; background: #fff8e1; color: #3b2f0b; font-size: 32px;
      box-shadow: 0 6px 20px rgb(0 0 0 / 22%); pointer-events: none; }
    [data-reduced-motion] * { animation: none !important; transition: none !important; }`;
  document.head.append(style);

  /** Fit the canvas into the frame, centred, with one uniform scale. */
  const fit = () => {
    const body = document.body;
    if (!body) return;
    const wide = innerWidth >= innerHeight ? 'landscape' : 'portrait';
    const layout = env?.layout ?? wide;
    const [width, height] = CANVAS[layout];
    const scale = Math.min(innerWidth / width, innerHeight / height);
    const x = (innerWidth - width * scale) / 2;
    const y = (innerHeight - height * scale) / 2;
    canvas = { layout, width, height, scale, x, y };
    document.documentElement.dataset.layout = layout;
    body.style.width = `${width}px`;
    body.style.height = `${height}px`;
    body.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };
  /** A viewport rectangle in canvas pixels. */
  const local = (box) => ({
    left: (box.left - canvas.x) / canvas.scale,
    top: (box.top - canvas.y) / canvas.scale,
    right: (box.right - canvas.x) / canvas.scale,
    bottom: (box.bottom - canvas.y) / canvas.scale,
  });

  const marks = () => {
    for (const el of document.querySelectorAll('.nl-highlight, .nl-revealed'))
      el.classList.remove('nl-highlight', 'nl-revealed');
    for (const el of document.querySelectorAll('.nl-note')) el.remove();
    for (const id of view.highlight) document.querySelector(id)?.classList.add('nl-highlight');
    for (const id of view.reveal) document.querySelector(id)?.classList.add('nl-revealed');
    for (const note of view.notes) {
      const target = document.querySelector(note.target);
      if (!target) continue;
      const box = local(target.getBoundingClientRect());
      const el = document.createElement('div');
      el.className = 'nl-note';
      el.textContent = note.text;
      document.body.append(el);
      // Below the target when it fits, otherwise above it; always inside the canvas.
      const fits = box.bottom + 12 + el.offsetHeight <= canvas.height;
      const top = fits ? box.bottom + 12 : Math.max(12, box.top - 12 - el.offsetHeight);
      const left = Math.min(Math.max(12, box.left), canvas.width - el.offsetWidth - 12);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }
    // A locked board follows the lesson: nothing in it can be focused or changed.
    document.body.inert = view.input !== 'open';
  };
  const draw = () => {
    if (!handlers || !view) return;
    try {
      handlers.onState(view, { ...env, layout: canvas.layout });
      marks();
    } catch (error) {
      post({ type: 'error', message: String(error && error.message ? error.message : error) });
    }
  };
  const ready = () => {
    if (announced || !handlers || !env) return;
    announced = true;
    document.fonts.ready.then(() => post({ type: 'ready', apiVersion: 1 }));
  };

  addEventListener('message', (event) => {
    if (event.source !== parent) return;
    const message = event.data;
    if (!message || message.nl !== 1) return;
    if (message.type === 'init') {
      const before = canvas.layout;
      env = message;
      document.documentElement.lang = message.lang;
      document.documentElement.dataset.theme = message.theme;
      if (message.reducedMotion) document.documentElement.dataset.reducedMotion = 'true';
      else delete document.documentElement.dataset.reducedMotion;
      fit();
      if (canvas.layout !== before) draw();
      ready();
    } else if (message.type === 'state' && message.view) {
      view = message.view;
      draw();
    } else if (message.type === 'check') {
      check(message.rules);
    }
  });
  /** The teacher's preview asks: does this drawing keep the canvas rules (board:check)? */
  const check = (rules) => {
    const run = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          let problems;
          try {
            problems = window.NewLearnBoardCheck(rules);
          } catch (error) {
            problems = [{ check: 'error', detail: String(error && error.message) }];
          }
          post({ type: 'report', layout: canvas.layout, width: innerWidth, problems });
        }),
      );
    if (window.NewLearnBoardCheck) return run();
    const script = document.createElement('script');
    script.src = '/lib/newlearn-board@1/check.js';
    script.onload = run;
    document.head.append(script);
  };
  addEventListener('resize', () => {
    const before = canvas.layout;
    fit();
    if (!view) return;
    if (canvas.layout !== before) draw();
    else marks();
  });
  addEventListener('error', (event) => post({ type: 'error', message: String(event.message) }));

  let pending = null;
  let timer = 0;
  window.NewLearnBoard = {
    start(next) {
      handlers = next;
      fit();
      ready();
      draw();
    },
    /** The canvas now: layout, size in canvas pixels, and its scale on screen. */
    get canvas() {
      return { ...canvas };
    },
    /** A pointer event's position in canvas pixels (use this for dragging and drawing). */
    point(event) {
      return {
        x: (event.clientX - canvas.x) / canvas.scale,
        y: (event.clientY - canvas.y) / canvas.scale,
      };
    },
    /** The learner changed values; the lesson clamps them and sends the new state back. */
    setVariables(values) {
      post({ type: 'variables', values });
    },
    /** What the board shows now, in one sentence a student could read. Sent at most 4×/s. */
    observe(summary, details) {
      pending = { summary, details };
      if (timer) return;
      timer = setTimeout(() => {
        timer = 0;
        post({ type: 'observation', observation: pending });
      }, 250);
    },
    fail(message) {
      post({ type: 'error', message: String(message) });
    },
  };
})();

// New Learn board helper, protocol v1 (docs/boards.md). Served from the board origin only.
// A board calls NewLearnBoard.start({ onState(view, env) { ...draw... } }) once, then
// NewLearnBoard.setVariables({...}) when the learner changes something and
// NewLearnBoard.observe('one sentence', details) to tell the tutor what the board shows.
(() => {
  const post = (message) => parent.postMessage({ nl: 1, ...message }, '*');
  let env = null;
  let handlers = null;
  let view = null;
  let announced = false;
  const style = document.createElement('style');
  style.textContent = `
    .nl-highlight { outline: 3px solid #e0a526; outline-offset: 4px; border-radius: 6px; }
    [data-reveal]:not(.nl-revealed) { visibility: hidden; }
    .nl-note { position: absolute; z-index: 10; max-width: 220px; padding: 6px 10px;
      border-radius: 10px; background: #fff8e1; color: #3b2f0b; font: 14px/1.4 system-ui;
      box-shadow: 0 4px 14px rgb(0 0 0 / 18%); pointer-events: none; }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`;
  document.head.append(style);

  const marks = () => {
    for (const el of document.querySelectorAll('.nl-highlight, .nl-revealed'))
      el.classList.remove('nl-highlight', 'nl-revealed');
    for (const el of document.querySelectorAll('.nl-note')) el.remove();
    for (const id of view.highlight) document.querySelector(id)?.classList.add('nl-highlight');
    for (const id of view.reveal) document.querySelector(id)?.classList.add('nl-revealed');
    for (const note of view.notes) {
      const target = document.querySelector(note.target);
      if (!target) continue;
      const box = target.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'nl-note';
      el.textContent = note.text;
      document.body.append(el);
      // Below the target when it fits, otherwise above it; always inside the board.
      const below = box.bottom + 8 + el.offsetHeight <= innerHeight;
      const top = below ? box.bottom + 8 : Math.max(8, box.top - 8 - el.offsetHeight);
      const left = Math.min(Math.max(8, box.left), innerWidth - el.offsetWidth - 8);
      el.style.left = `${left + scrollX}px`;
      el.style.top = `${top + scrollY}px`;
    }
    // A locked board follows the lesson: nothing in it can be focused or changed.
    document.body.inert = view.input !== 'open';
  };
  const draw = () => {
    if (!handlers || !view) return;
    try {
      handlers.onState(view, env);
      marks();
    } catch (error) {
      post({ type: 'error', message: String(error && error.message ? error.message : error) });
    }
  };
  const ready = () => {
    if (announced || !handlers || !env) return;
    announced = true;
    post({ type: 'ready', apiVersion: 1 });
  };

  addEventListener('message', (event) => {
    if (event.source !== parent) return;
    const message = event.data;
    if (!message || message.nl !== 1) return;
    if (message.type === 'init') {
      env = message;
      document.documentElement.lang = message.lang;
      document.documentElement.dataset.theme = message.theme;
      if (message.reducedMotion) document.documentElement.dataset.reducedMotion = 'true';
      ready();
    } else if (message.type === 'state' && message.view) {
      view = message.view;
      draw();
    }
  });
  addEventListener('error', (event) => post({ type: 'error', message: String(event.message) }));

  let pending = null;
  let timer = 0;
  window.NewLearnBoard = {
    start(next) {
      handlers = next;
      ready();
      draw();
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

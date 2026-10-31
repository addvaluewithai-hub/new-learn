// The Sun, eight planets and the Moon in three.js. Distances are compressed (log scale) and
// sizes exaggerated so everything fits one view; the periods are real, so the inner planets
// visibly lap the outer ones. `speed` is how many days pass per second.
const BODIES = [
  // id, colour, radius (scene units), distance (AU), year (days), spin (days)
  { id: 'sun', color: '#ffcf5a', r: 1.3, au: 0, year: 0, spin: 25 },
  { id: 'mercury', color: '#b9b0a6', r: 0.16, au: 0.39, year: 88, spin: 59 },
  { id: 'venus', color: '#e8c58a', r: 0.26, au: 0.72, year: 225, spin: -243 },
  { id: 'earth', color: '#3b7bd8', r: 0.28, au: 1, year: 365, spin: 1 },
  { id: 'mars', color: '#d2573a', r: 0.2, au: 1.52, year: 687, spin: 1.03 },
  { id: 'jupiter', color: '#d9a46f', r: 0.72, au: 5.2, year: 4333, spin: 0.41 },
  { id: 'saturn', color: '#e6cf8f', r: 0.62, au: 9.5, year: 10759, spin: 0.45 },
  { id: 'uranus', color: '#9fd8e3', r: 0.42, au: 19.2, year: 30687, spin: -0.72 },
  { id: 'neptune', color: '#4c6fe0', r: 0.4, au: 30.1, year: 60190, spin: 0.67 },
];
/** Orbit radius in scene units: compressed so Neptune sits at about 14. */
const orbitOf = (au) => (au ? 2.2 + 4.6 * Math.log10(1 + au * 3) : 0);

function buildSolar(THREE, container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070b1f');
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  // Stars from a fixed seed.
  let seed = 17;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const u = rnd() * 2 - 1,
      a = rnd() * Math.PI * 2,
      s = Math.sqrt(1 - u * u);
    stars.set([90 * s * Math.cos(a), 90 * u, 90 * s * Math.sin(a)], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#c8d0ff', size: 0.22 })));
  scene.add(new THREE.PointLight('#fff4dd', 3.5, 0, 0));
  scene.add(new THREE.AmbientLight('#8090ff', 0.35));
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const g = glowCanvas.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,214,110,0.95)');
  gr.addColorStop(0.3, 'rgba(255,170,60,0.4)');
  gr.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  glow.scale.set(7, 7, 1);
  scene.add(glow);

  const bodies = {};
  for (const b of BODIES) {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(b.r, 48, 32),
      b.id === 'sun'
        ? new THREE.MeshBasicMaterial({ color: b.color })
        : new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 }),
    );
    const d = orbitOf(b.au);
    mesh.position.x = d;
    pivot.add(mesh);
    scene.add(pivot);
    if (d) {
      const pts = [];
      for (let i = 0; i <= 160; i++)
        pts.push(
          new THREE.Vector3(
            d * Math.cos((i / 160) * Math.PI * 2),
            0,
            d * Math.sin((i / 160) * Math.PI * 2),
          ),
        );
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: '#2d3d80' }),
        ),
      );
    }
    if (b.id === 'saturn') {
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(b.r * 1.3, b.r * 2.1, 64),
        new THREE.MeshBasicMaterial({
          color: '#d8c89a',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        }),
      );
      ringMesh.rotation.x = Math.PI / 2.4;
      mesh.add(ringMesh);
    }
    bodies[b.id] = { ...b, pivot, mesh, d, angle: rnd() * Math.PI * 2 };
  }
  // The Moon round the Earth: 27 days, close in.
  const moonPivot = new THREE.Group();
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 24, 16),
    new THREE.MeshStandardMaterial({ color: '#d6d6d6', roughness: 0.9 }),
  );
  moon.position.x = 0.55;
  moonPivot.add(moon);
  bodies.earth.mesh.add(moonPivot);
  let moonAngle = 0;

  let size = null,
    frame = 0,
    last = 0,
    speed = 0,
    focus = 'all',
    cam = { from: null, to: null, start: 0 };
  const world = new THREE.Vector3();
  const viewFor = (id, layout) => {
    const portrait = layout === 'portrait';
    if (id === 'all')
      return { pos: portrait ? [0, 24, 26] : [0, 17, 23], look: [0, 0, 0], dist: null };
    const b = bodies[id];
    return { pos: null, look: null, dist: b.r * (portrait ? 6 : 4.5) + 0.8, body: b };
  };
  const placeCamera = (view, k) => {
    if (view.body) {
      view.body.mesh.getWorldPosition(world);
      const target = new THREE.Vector3(
        world.x + view.dist * 0.6,
        world.y + view.dist * 0.5,
        world.z + view.dist * 0.8,
      );
      if (!cam.from || k >= 1) camera.position.copy(target);
      else camera.position.lerpVectors(cam.from, target, k);
      camera.lookAt(world);
    } else {
      const target = new THREE.Vector3(...view.pos);
      if (!cam.from || k >= 1) camera.position.copy(target);
      else camera.position.lerpVectors(cam.from, target, k);
      camera.lookAt(0, 0, 0);
    }
  };
  const tick = (now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const days = dt * speed;
    for (const b of Object.values(bodies)) {
      if (b.year) b.angle += ((Math.PI * 2) / b.year) * days;
      b.pivot.rotation.y = b.angle;
      b.mesh.rotation.y += b.spin
        ? ((Math.PI * 2) / Math.abs(b.spin)) * days * 0.02 * Math.sign(b.spin)
        : 0;
    }
    moonAngle += ((Math.PI * 2) / 27.3) * days;
    moonPivot.rotation.y = moonAngle;
    const k = cam.start ? Math.min(1, (now - cam.start) / 900) : 1;
    placeCamera(cam.to, k * k * (3 - 2 * k));
    if (k >= 1) cam.from = null;
    renderer.render(scene, camera);
    if (speed > 0 || k < 1) frame = requestAnimationFrame(tick);
    else frame = 0;
  };
  return {
    show({ focus: f, speed: s, layout, animate }) {
      const next = layout === 'portrait' ? [720, 580] : [820, 720];
      if (!size || size[0] !== next[0]) {
        size = next;
        renderer.setSize(next[0], next[1]);
        camera.aspect = next[0] / next[1];
        camera.updateProjectionMatrix();
        cam = { from: null, to: viewFor(f, layout), start: 0 };
      }
      if (f !== focus || !cam.to) {
        focus = f;
        cam = {
          from: animate ? camera.position.clone() : null,
          to: viewFor(f, layout),
          start: animate ? performance.now() : 0,
        };
      }
      speed = animate ? s : 0;
      cancelAnimationFrame(frame);
      last = 0;
      frame = requestAnimationFrame(tick);
    },
    facts: Object.fromEntries(BODIES.map((b) => [b.id, { au: b.au, year: b.year }])),
  };
}

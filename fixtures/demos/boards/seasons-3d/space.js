// The Sun, the orbit and the tilted Earth in three.js. Not to scale. The Earth's axis keeps
// pointing the same way in space all year; June puts its north pole toward the Sun.
const R = 5;

function glowTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  [
    [0, 'rgba(255,214,110,0.95)'],
    [0.25, 'rgba(255,170,60,0.45)'],
    [0.6, 'rgba(255,140,40,0.12)'],
    [1, 'rgba(255,140,40,0)'],
  ].forEach(([s, col]) => gr.addColorStop(s, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
function textSprite(THREE, text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 80;
  const g = c.getContext('2d');
  g.font = "600 40px 'NL Sans', sans-serif";
  g.fillStyle = '#c9d4ff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 40);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }),
  );
  sprite.scale.set(3.2, 1, 1);
  return sprite;
}
const ring = (THREE, radius, y, color) => {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({ color }),
  );
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
};

function buildSpace(THREE, container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050816');
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  // Stars, from a fixed seed.
  let seed = 9;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const u = rnd() * 2 - 1,
      a = rnd() * Math.PI * 2,
      s = Math.sqrt(1 - u * u);
    stars.set([60 * s * Math.cos(a), 60 * u, 60 * s * Math.sin(a)], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#c8d0ff', size: 0.18 })));
  // The Sun, its glow and its light.
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 48, 32),
      new THREE.MeshBasicMaterial({ color: '#ffcf5a' }),
    ),
  );
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(THREE), transparent: true, depthWrite: false }),
  );
  glow.scale.set(7, 7, 1);
  scene.add(glow);
  scene.add(new THREE.PointLight('#fff4dd', 3.2, 0, 0));
  scene.add(new THREE.AmbientLight('#8090ff', 0.3));
  // The orbit and four months on it.
  const orbit = [];
  for (let i = 0; i <= 128; i++)
    orbit.push(
      new THREE.Vector3(
        R * Math.cos((i / 128) * Math.PI * 2),
        0,
        R * Math.sin((i / 128) * Math.PI * 2),
      ),
    );
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbit),
      new THREE.LineBasicMaterial({ color: '#3d4f96' }),
    ),
  );
  const marks = new THREE.Group();
  scene.add(marks);
  // The Earth: a tilted group holding the globe, its axis, the equator and Cairo's latitude.
  const earth = new THREE.Group();
  const tilted = new THREE.Group();
  earth.add(tilted);
  scene.add(earth);
  const r = 1.05;
  tilted.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(r, 64, 48),
      new THREE.MeshStandardMaterial({ color: '#2f6fd6', roughness: 0.75 }),
    ),
  );
  const north = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.002, 64, 24, 0, Math.PI * 2, 0, Math.PI / 3.2),
    new THREE.MeshStandardMaterial({ color: '#3f9a6a', roughness: 0.85 }),
  );
  tilted.add(north);
  tilted.add(ring(THREE, r * 1.01, 0, '#ffffff'));
  tilted.add(ring(THREE, r * Math.cos(Math.PI / 6) * 1.01, r * Math.sin(Math.PI / 6), '#ffd36e'));
  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.8, 12),
    new THREE.MeshBasicMaterial({ color: '#e8ecff' }),
  );
  tilted.add(axis);
  const pole = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffd36e' }),
  );
  pole.position.y = 1.4;
  tilted.add(pole);

  let size = null,
    shown = null,
    frame = 0,
    labels = null;
  const place = (angle, tilt) => {
    earth.position.set(R * Math.cos(angle), 0, R * Math.sin(angle));
    tilted.rotation.z = (-tilt * Math.PI) / 180;
  };
  const render = () => renderer.render(scene, camera);
  return {
    show({ month, tilt, layout, animate, labels: names }) {
      const next = layout === 'portrait' ? [720, 680] : [820, 720];
      if (!size || size[0] !== next[0]) {
        size = next;
        renderer.setSize(next[0], next[1]);
        camera.aspect = next[0] / next[1];
        if (layout === 'portrait') camera.position.set(0, 11.5, 17.5);
        else camera.position.set(0, 8.5, 14.5);
        camera.lookAt(0, -0.8, 0);
        camera.updateProjectionMatrix();
      }
      if (names !== labels) {
        labels = names;
        marks.clear();
        for (const m of [3, 6, 9, 12]) {
          const a = orbitAngle(m);
          const s = textSprite(THREE, names[m - 1]);
          s.position.set(R * Math.cos(a), -1.75, R * Math.sin(a));
          marks.add(s);
        }
      }
      const target = { angle: orbitAngle(month), tilt };
      cancelAnimationFrame(frame);
      if (!animate || !shown) {
        shown = target;
        place(target.angle, target.tilt);
        return render();
      }
      const from = shown;
      let delta = target.angle - from.angle;
      while (delta < 0) delta += Math.PI * 2;
      while (delta >= Math.PI * 2) delta -= Math.PI * 2;
      const start = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - start) / 1000);
        const e = k * k * (3 - 2 * k);
        place(from.angle + delta * e, from.tilt + (target.tilt - from.tilt) * e);
        render();
        if (k < 1) frame = requestAnimationFrame(tick);
      };
      shown = target;
      frame = requestAnimationFrame(tick);
    },
  };
}

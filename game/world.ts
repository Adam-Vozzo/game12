import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ISLANDS, SPOTS } from './data';
export type WorldView = {
  x: number;
  z: number;
  angle: number;
  time: number;
  mode: string;
  depth: number;
  moving: boolean;
  quality: string;
  reducedMotion: boolean;
  hookX?: number;
  hookY?: number;
  fish?: { x: number; y: number; color: string; scale: number }[];
  diveX?: number;
  diveZ?: number;
  seabedDepth?: number;
  loot?: {
    x: number;
    z: number;
    depth: number;
    kind: string;
    collected: boolean;
  }[];
};
export function createWorld(host: HTMLElement, read: () => WorldView) {
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (
    c: THREE.ColorRepresentation,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) => {
    const key = JSON.stringify([c, extra]);
    if (!materialCache.has(key))
      materialCache.set(
        key,
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.85,
          flatShading: true,
          ...extra,
        }),
      );
    return materialCache.get(key)!;
  };
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    'aria-label',
    '3D ocean, islands, fishing boat and underwater exploration',
  );
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#76ced2');
  scene.fog = new THREE.Fog('#76ced2', 130, 390);
  const camera = new THREE.PerspectiveCamera(
    42,
    host.clientWidth / host.clientHeight,
    0.1,
    700,
  );
  const ambient = new THREE.HemisphereLight('#e9ffff', '#447b86', 2.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff1c4', 3.2);
  sun.position.set(-50, 100, 30);
  scene.add(sun);
  const surface = new THREE.Group();
  scene.add(surface);
  function mesh(
    g: THREE.BufferGeometry,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    parent: THREE.Object3D = surface,
  ) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  }
  const sand = mat('#efdba1'),
    shore = mat('#78d9c9'),
    stone = mat('#7c9390'),
    wood = mat('#91684d'),
    cream = mat('#fff0cf'),
    teal = mat('#347c7c'),
    roof = mat('#c6674d');
  const seaUniforms = { uTime: { value: 0 }, uNight: { value: 0 } };
  const oceanMat = new THREE.ShaderMaterial({
    uniforms: seaUniforms,
    vertexShader: `varying vec3 vPos; uniform float uTime; void main(){vec3 p=position;p.z+=sin(p.x*.13+uTime*.7)*.32+cos(p.y*.17-uTime*.6)*.25;vPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec3 vPos;uniform float uTime;uniform float uNight;void main(){float w=sin(vPos.x*.3+vPos.y*.18+uTime*.5)*cos(vPos.y*.45-uTime*.6);float sparkle=pow(max(0.,sin(vPos.x*.9+vPos.y*.6+uTime)*cos(vPos.y*.9-uTime*.6)),24.);vec3 c=mix(vec3(.045,.48,.56),vec3(.13,.68,.69),w*.5+.5);c+=sparkle*.24;c=mix(c,c*vec3(.16,.30,.52),uNight);gl_FragColor=vec4(c,1.);}`,
  });
  mesh(
    new THREE.PlaneGeometry(1100, 1100, 100, 100),
    oceanMat,
    0,
    -0.18,
    0,
  ).rotation.x = -Math.PI / 2;
  let rng = 42;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  function palm(x: number, z: number, s = 1, parent: THREE.Object3D = surface) {
    const g = new THREE.Group();
    g.position.set(x, 2, z);
    g.scale.setScalar(s);
    parent.add(g);
    mesh(
      new THREE.CylinderGeometry(0.35, 0.65, 7, 5),
      wood,
      0,
      3.5,
      0,
      g,
    ).rotation.z = 0.12;
    for (let i = 0; i < 7; i++) {
      const leaf = mesh(
        new THREE.SphereGeometry(1, 4, 3),
        mat(i % 2 ? '#368560' : '#5aa966'),
        Math.sin(i * 0.9) * 2.1 - 0.4,
        7,
        Math.cos(i * 0.9) * 2.1,
        g,
      );
      leaf.scale.set(1.15, 0.2, 3.7);
      leaf.rotation.y = i * 0.9;
      leaf.rotation.x = 0.2;
    }
  }
  ISLANDS.forEach((island, idx) => {
    const root = new THREE.Group();
    root.position.set(island.x, 0, island.z);
    surface.add(root);
    mesh(
      new THREE.CylinderGeometry(
        island.radius + 8,
        island.radius + 9,
        0.14,
        30,
      ),
      shore,
      0,
      -0.03,
      0,
      root,
    );
    mesh(
      new THREE.CylinderGeometry(island.radius, island.radius + 4, 2.2, 18),
      sand,
      0,
      0.8,
      0,
      root,
    );
    const land = mesh(
      new THREE.SphereGeometry(1, 12, 5),
      mat(island.color),
      -2,
      1.5,
      -2,
      root,
    );
    land.scale.set(island.radius * 0.82, 3.9, island.radius * 0.78);
    for (let i = 0; i < 6; i++) {
      const a = rand() * Math.PI * 2,
        r = island.radius * (0.45 + rand() * 0.35);
      mesh(
        new THREE.DodecahedronGeometry(1, 0),
        stone,
        Math.cos(a) * r,
        1.9,
        Math.sin(a) * r,
        root,
      ).scale.set(1 + rand() * 2, 1 + rand() * 2, 1 + rand() * 2);
    }
    for (let i = 0; i < (idx === 4 ? 2 : 6); i++) {
      const a = rand() * 6.28,
        r = rand() * island.radius * 0.64;
      palm(Math.cos(a) * r, Math.sin(a) * r, 0.65 + rand() * 0.5, root);
    }
    if ([0, 1, 2, 6].includes(idx)) {
      const house = new THREE.Group();
      house.position.set(-4, 2, 0);
      root.add(house);
      mesh(new THREE.BoxGeometry(7, 4, 5), cream, 0, 2, 0, house);
      mesh(
        new THREE.ConeGeometry(5.6, 3, 4),
        roof,
        0,
        5.4,
        0,
        house,
      ).rotation.y = Math.PI / 4;
      mesh(new THREE.BoxGeometry(1.6, 2.8, 0.15), teal, 0, 1.4, 2.55, house);
      for (const x of [-2.3, 2.3])
        mesh(new THREE.BoxGeometry(1.1, 1.4, 0.16), teal, x, 2.4, 2.56, house);
      mesh(new THREE.BoxGeometry(4, 2.4, 3), wood, 5, 3.2, 2, root);
      mesh(new THREE.BoxGeometry(5, 0.3, 4), mat('#e9b869'), 5, 4.6, 2, root);
    }
    const dx = island.port.x - island.x,
      dz = island.port.z - island.z,
      len = Math.hypot(dx, dz);
    const dock = new THREE.Group();
    dock.position.set(island.x, 1.3, island.z);
    dock.rotation.y = Math.atan2(dx, dz);
    surface.add(dock);
    for (let j = island.radius - 2; j < len + 2; j += 1.1)
      mesh(new THREE.BoxGeometry(3.5, 0.35, 0.85), wood, 0, 0, j, dock);
    for (const x of [-1.5, 1.5])
      for (const z of [island.radius, len])
        mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 3, 6),
          wood,
          x,
          -0.4,
          z,
          dock,
        );
    if (idx === 0) {
      const tower = new THREE.Group();
      tower.position.set(7, 3, -8);
      root.add(tower);
      mesh(new THREE.CylinderGeometry(1.4, 2, 10, 10), cream, 0, 5, 0, tower);
      mesh(
        new THREE.CylinderGeometry(1.6, 1.8, 1.8, 10),
        roof,
        0,
        5.6,
        0,
        tower,
      );
      mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.4, 10),
        teal,
        0,
        10,
        0,
        tower,
      );
      mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 2, 8),
        mat('#ffd17a', { emissive: '#ffba54', emissiveIntensity: 0.7 }),
        0,
        11,
        0,
        tower,
      );
      mesh(new THREE.ConeGeometry(2.3, 1.7, 10), teal, 0, 12.8, 0, tower);
    }
    if (idx === 4)
      mesh(new THREE.ConeGeometry(9, 20, 7), mat('#585e66'), -4, 10, -5, root);
    if (idx === 5) {
      for (const x of [-5, 5])
        mesh(new THREE.BoxGeometry(2, 11, 2), mat('#9ba1b4'), x, 6, 0, root);
      mesh(new THREE.BoxGeometry(12, 2.3, 3), mat('#9ba1b4'), 0, 11, 0, root);
    }
  });
  // Merge static island meshes by material to keep draw calls low on phones.
  function mergeStatic(root: THREE.Group, exclude?: THREE.Material) {
    root.updateMatrixWorld(true);
    const inverse = root.matrixWorld.clone().invert();
    const batches = new Map<
      THREE.Material,
      { geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }
    >();
    root.traverse((o) => {
      if (
        !(o instanceof THREE.Mesh) ||
        Array.isArray(o.material) ||
        o.material === exclude
      )
        return;
      const group = batches.get(o.material) || { geometries: [], meshes: [] };
      const geo = o.geometry
        .clone()
        .applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      group.geometries.push(geo);
      group.meshes.push(o);
      batches.set(o.material, group);
    });
    batches.forEach((batch, material) => {
      const joined = mergeGeometries(batch.geometries, false);
      if (joined) {
        root.add(new THREE.Mesh(joined, material));
        batch.meshes.forEach((o) => {
          o.removeFromParent();
          o.geometry.dispose();
        });
      }
      batch.geometries.forEach((geo) => geo.dispose());
    });
  }
  mergeStatic(surface, oceanMat);
  const rings: THREE.Mesh[] = [];
  SPOTS.forEach((p) => {
    const ring = mesh(
      new THREE.RingGeometry(4.2, 4.32, 48),
      new THREE.MeshBasicMaterial({
        color: '#d0fff1',
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
      p.x,
      0.24,
      p.z,
    );
    ring.rotation.x = -Math.PI / 2;
    rings.push(ring);
    for (let i = 0; i < 5; i++) {
      const f = mesh(
        new THREE.SphereGeometry(1, 5, 3),
        mat('#285f70'),
        p.x + Math.sin(i * 1.2) * 2.5,
        -0.02,
        p.z + Math.cos(i * 1.2) * 2.5,
      );
      f.scale.set(0.25, 0.07, 0.6);
      f.rotation.y = i * 1.2;
    }
  });
  const boat = new THREE.Group();
  surface.add(boat);
  mesh(
    new THREE.SphereGeometry(1, 8, 5),
    mat('#eee4c1'),
    0,
    0.4,
    0,
    boat,
  ).scale.set(1.6, 0.95, 3);
  mesh(new THREE.BoxGeometry(2.6, 0.23, 3.8), wood, 0, 0.95, -0.2, boat);
  for (const x of [-1.35, 1.35])
    mesh(new THREE.BoxGeometry(0.16, 0.65, 3.7), teal, x, 1.1, 0, boat);
  mesh(new THREE.BoxGeometry(2.3, 1.8, 1.8), cream, 0, 1.8, -0.3, boat);
  mesh(new THREE.BoxGeometry(2.65, 0.25, 2.2), roof, 0, 2.8, -0.3, boat);
  mesh(new THREE.BoxGeometry(1.65, 0.85, 0.06), teal, 0, 2, 0.64, boat);
  mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 4.8, 5),
    wood,
    0.65,
    3.2,
    -1.3,
    boat,
  );
  const flag = mesh(
    new THREE.PlaneGeometry(1.1, 0.65),
    new THREE.MeshBasicMaterial({ color: '#f1c967', side: THREE.DoubleSide }),
    1.2,
    5.15,
    -1.3,
    boat,
  );
  mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8),
    mat('#ecd88d'),
    -0.6,
    1.65,
    1.5,
    boat,
  );
  mesh(
    new THREE.SphereGeometry(0.32, 8, 6),
    mat('#d4a17d'),
    -0.6,
    1.3,
    1.5,
    boat,
  );
  const wake = mesh(
    new THREE.ConeGeometry(2, 10, 3),
    new THREE.MeshBasicMaterial({
      color: '#bff8ec',
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
    0,
    -0.08,
    -6,
    boat,
  );
  wake.rotation.x = Math.PI / 2;
  wake.scale.z = 0.01;
  const gulls: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    surface.add(g);
    for (const x of [-0.55, 0.55])
      mesh(
        new THREE.BoxGeometry(1.3, 0.05, 0.35),
        cream,
        x,
        0,
        0,
        g,
      ).rotation.z = x * 0.4;
    gulls.push(g);
  }
  const underwater = new THREE.Group();
  scene.add(underwater);
  underwater.visible = false;
  const seabed = new THREE.Group();
  underwater.add(seabed);
  mesh(
    new THREE.PlaneGeometry(220, 220),
    mat('#195b64'),
    0,
    0,
    0,
    seabed,
  ).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 65; i++) {
    const coral = mesh(
      new THREE.IcosahedronGeometry(0.8 + rand() * 2, 0),
      mat(['#c37d90', '#7ab59b', '#af9dce', '#dfb36b'][i % 4], {
        emissive: '#275b60',
        emissiveIntensity: 0.2,
      }),
      (rand() - 0.5) * 110,
      1,
      (rand() - 0.5) * 110,
      seabed,
    );
    coral.scale.y = 1 + rand() * 3;
  }
  mergeStatic(seabed);
  const diver = new THREE.Group();
  underwater.add(diver);
  mesh(
    new THREE.CapsuleGeometry(0.5, 1.4, 4, 8),
    mat('#f1b954'),
    0,
    0,
    0,
    diver,
  ).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.5, 12, 8), mat('#f4d6b4'), 0, 0, 1.2, diver);
  mesh(new THREE.BoxGeometry(0.8, 0.4, 0.2), teal, 0, 0.1, 1.58, diver);
  mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8),
    cream,
    0,
    0.5,
    -0.1,
    diver,
  ).rotation.x = Math.PI / 2;
  for (const x of [-0.38, 0.38])
    mesh(new THREE.BoxGeometry(0.5, 0.15, 1.2), teal, x, 0, -1.7, diver);
  const fishGroup = new THREE.Group();
  underwater.add(fishGroup);
  const fishMeshes: THREE.Group[] = [];
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group();
    mesh(
      new THREE.SphereGeometry(1, 10, 6),
      mat('#f0ad67'),
      0,
      0,
      0,
      g,
    ).scale.set(1.1, 0.52, 0.34);
    mesh(
      new THREE.ConeGeometry(0.6, 0.7, 3),
      mat('#f4bd7a'),
      -1.3,
      0,
      0,
      g,
    ).rotation.z = Math.PI / 2;
    mesh(
      new THREE.SphereGeometry(0.085, 6, 4),
      mat('#172e37'),
      0.6,
      0.14,
      0.31,
      g,
    );
    fishGroup.add(g);
    fishMeshes.push(g);
  }
  const hook = new THREE.Group();
  underwater.add(hook);
  const hookCurve = new THREE.EllipseCurve(
    0,
    0,
    0.35,
    0.5,
    Math.PI,
    Math.PI * 2.3,
    false,
    0,
  );
  hook.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        hookCurve.getPoints(20).map((p) => new THREE.Vector3(p.x, p.y, 0)),
      ),
      new THREE.LineBasicMaterial({ color: '#ffe6ab' }),
    ),
  );
  hook.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(0, 30, 0),
      ]),
      new THREE.LineBasicMaterial({
        color: '#d5f4e6',
        transparent: true,
        opacity: 0.6,
      }),
    ),
  );
  const lootMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < 30; i++)
    lootMeshes.push(
      mesh(
        new THREE.OctahedronGeometry(0.75, 0),
        mat('#f5df97', { emissive: '#a98030', emissiveIntensity: 0.5 }),
        0,
        0,
        0,
        underwater,
      ),
    );
  const bubbleGeo = new THREE.BufferGeometry();
  const bubblePos = new Float32Array(180 * 3);
  for (let i = 0; i < bubblePos.length; i++)
    bubblePos[i] = (rand() - 0.5) * 100;
  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));
  const bubbles = new THREE.Points(
    bubbleGeo,
    new THREE.PointsMaterial({
      color: '#b8efec',
      size: 0.17,
      transparent: true,
      opacity: 0.4,
    }),
  );
  underwater.add(bubbles);
  let frame = 0,
    last = performance.now(),
    t = 0,
    quality = '',
    stopped = false,
    initialized = false;
  const target = new THREE.Vector3(),
    desired = new THREE.Vector3();
  const cache = new Map<string, THREE.Material>();
  function fishMaterial(c: string) {
    if (!cache.has(c))
      cache.set(c, mat(c, { emissive: c, emissiveIntensity: 0.12 }));
    return cache.get(c)!;
  }
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function animate(now: number) {
    if (stopped) return;
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const s = read();
    if (!s.reducedMotion) t += dt;
    if (s.quality !== quality) {
      quality = s.quality;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, quality === 'low' ? 1 : 1.75),
      );
      resize();
    }
    const under = s.mode === 'dive' || s.mode === 'fishing';
    surface.visible = !under;
    underwater.visible = under;
    const night = s.time >= 19 || s.time < 5;
    seaUniforms.uNight.value = THREE.MathUtils.lerp(
      seaUniforms.uNight.value,
      night ? 1 : 0,
      0.03,
    );
    seaUniforms.uTime.value = t;
    ambient.intensity = under ? 2 : night ? 0.9 : 2.3;
    sun.intensity = under ? 1.2 : night ? 0.6 : 3.2;
    (scene.background as THREE.Color).lerp(
      new THREE.Color(under ? '#0b485e' : night ? '#102941' : '#78cdd2'),
      0.04,
    );
    (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
    if (!under) {
      boat.position.set(s.x, Math.sin(t * 1.8) * 0.13, s.z);
      boat.rotation.set(
        Math.sin(t * 1.7) * 0.025,
        s.angle,
        Math.cos(t * 1.6) * 0.035,
      );
      wake.visible = s.moving;
      flag.rotation.y = Math.sin(t * 3) * 0.15;
      rings.forEach((r, i) =>
        r.scale.setScalar(1 + Math.sin(t * 1.5 + i) * 0.08),
      );
      gulls.forEach((g, i) => {
        g.position.set(
          -30 + Math.sin(t * 0.12 + i) * 35,
          15 + i * 0.5,
          -24 + Math.cos(t * 0.12 + i) * 25,
        );
        g.rotation.y = -t * 0.12 - i;
      });
      target.set(s.x, 0, s.z - 6);
      desired.set(s.x + 45, 74, s.z + (camera.aspect < 0.8 ? 69 : 60));
    } else if (s.mode === 'fishing') {
      diver.visible = false;
      hook.visible = true;
      seabed.position.y = -27;
      target.set(0, -8, 0);
      desired.set(
        0,
        -8,
        Math.max(44, 21 / (Math.tan((21 * Math.PI) / 180) * camera.aspect)),
      );
      hook.position.set(
        ((s.hookX ?? 0.5) - 0.5) * 38,
        4 - (s.hookY ?? 0.5) * 24,
        1,
      );
      fishMeshes.forEach((f, i) => {
        const v = s.fish?.[i];
        f.visible = !!v;
        if (v) {
          f.position.set((v.x - 0.5) * 38, 4 - v.y * 24, 0);
          f.scale.setScalar(v.scale);
          (f.children[0] as THREE.Mesh).material = fishMaterial(v.color);
          f.rotation.y = Math.sin(t + i) > 0 ? 0 : Math.PI;
        }
      });
      lootMeshes.forEach((o) => (o.visible = false));
    } else {
      diver.visible = true;
      hook.visible = false;
      const dx = s.diveX ?? 0,
        dz = s.diveZ ?? 0;
      diver.position.set(dx, -s.depth, dz);
      diver.rotation.y = s.angle;
      target.set(dx, -s.depth, dz);
      desired.set(dx + 17, -s.depth + 21, dz + 29);
      fishMeshes.forEach((f, i) => {
        f.visible = true;
        f.position.set(
          dx + Math.sin(t * 0.22 + i * 2) * 19,
          -s.depth + Math.cos(t * 0.3 + i) * 8,
          dz + Math.cos(t * 0.2 + i) * 17,
        );
        f.scale.setScalar(0.5 + (i % 3) * 0.25);
        f.rotation.y = t * 0.2 + i;
      });
      lootMeshes.forEach((o, i) => {
        const l = s.loot?.[i];
        o.visible = !!l && !l.collected;
        if (l) {
          o.position.set(l.x, -l.depth, l.z);
          o.rotation.y = t * 0.7;
          o.scale.setScalar(l.kind === 'relic' ? 1.5 : 0.7);
        }
      });
    }
    if (s.mode === 'dive') seabed.position.y = -(s.seabedDepth ?? 30);
    bubbles.position.y = under ? -s.depth : 0;
    bubbles.rotation.y = t * 0.01;
    if (!initialized) {
      camera.position.copy(desired);
      initialized = true;
    } else camera.position.lerp(desired, 1 - Math.exp(-dt * 4));
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  const raycaster = new THREE.Raycaster(),
    plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1),
    point = new THREE.Vector3();
  frame = requestAnimationFrame(animate);
  return {
    aim(clientX: number, clientY: number) {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          (-(clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      if (!raycaster.ray.intersectPlane(plane, point)) return null;
      return { x: point.x / 38 + 0.5, y: (4 - point.y) / 24 };
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (
          o instanceof THREE.Mesh ||
          o instanceof THREE.Line ||
          o instanceof THREE.Points
        ) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      materialCache.forEach((m) => m.dispose());
      cache.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  COW_SOIL,
  COW_SEED,
  COW_ROCK,
  SEA_ROCK,
  includes,
  cowTrial,
  seaTrial,
} from "../v3/model.mjs";
const PALETTE = {
  earth: 0x928361,
  grass: 0x8fa878,
  green: 0x326e60,
  wood: 0x785139,
  water: 0x459da5,
  roof: 0x396560,
};
export function makeInkTexture(strokes) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 480;
  const c = canvas.getContext("2d");
  for (const s of strokes || []) {
    c.strokeStyle = s.color;
    c.fillStyle = s.color;
    c.lineWidth = s.width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    s.points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (s.points.length === 1) {
      c.arc(...s.points[0], s.width / 2, 0, Math.PI * 2);
      c.fill();
    } else {
      if (s.fill) {
        c.closePath();
        c.fillStyle = s.fill;
        c.fill();
      }
      c.stroke();
    }
  }
  const tx = new T.CanvasTexture(canvas);
  tx.colorSpace = T.SRGBColorSpace;
  return tx;
}
function label(text) {
  const c = document.createElement("canvas");
  c.width = Math.max(150, text.length * 50 + 48);
  c.height = 112;
  const x = c.getContext("2d");
  x.fillStyle = "#fff8e6";
  x.beginPath();
  x.roundRect(2, 4, c.width - 4, 104, 24);
  x.fill();
  x.fillStyle = "#244b46";
  x.font = "bold 48px Microsoft YaHei, sans-serif";
  x.textAlign = "center";
  x.fillText(text, c.width / 2, 73);
  const tx = new T.CanvasTexture(c);
  tx.colorSpace = T.SRGBColorSpace;
  const s = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false }));
  s.scale.set(c.width / 215, 0.52, 1);
  s.renderOrder = 4;
  return s;
}
export function createWorld(
  host,
  { kind, onAction, onReady, onError, quiet = false },
) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch (e) {
    onError();
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.setAttribute(
    "aria-label",
    kind === "map" ? "村庄立体场景" : "可以动手操作的立体场景",
  );
  canvas.tabIndex = 0;
  host.appendChild(canvas);
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x8eb1a4, 0.012);
  const root = new T.Group();
  scene.add(root);
  const camera = new T.PerspectiveCamera(37, 1, 0.1, 180);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enabled = false;
  controls.minPolarAngle = 0.0001;
  controls.maxPolarAngle = 1.35;
  controls.target.set(0, 0.2, 0);
  const hemi = new T.HemisphereLight(0xf8f1d6, 0x436e69, 1.8);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xffe2b0, 2.6);
  sun.position.set(-7, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  const materials = new Map();
  const mat = (color) => {
    if (!materials.has(color))
      materials.set(
        color,
        new T.MeshStandardMaterial({
          color,
          roughness: 0.88,
          flatShading: true,
        }),
      );
    return materials.get(color);
  };
  function mesh(geo, color, parent = root, x = 0, y = 0, z = 0) {
    const o = new T.Mesh(geo, mat(color));
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const box = (w, h, d, col, p, x = 0, y = 0, z = 0) =>
    mesh(new T.BoxGeometry(w, h, d), col, p, x, y, z);
  const cyl = (r, rb, h, col, p, x = 0, y = 0, z = 0, n = 32) =>
    mesh(new T.CylinderGeometry(r, rb, h, n), col, p, x, y, z);
  function tree(x, z, scale = 1, parent = root) {
    const g = new T.Group();
    parent.add(g);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    cyl(0.12, 0.18, 1.3, 0x795941, g, 0, 0.65);
    mesh(new T.IcosahedronGeometry(0.9, 0), 0x46785b, g, 0, 1.65);
    mesh(new T.IcosahedronGeometry(0.65, 0), 0x729368, g, 0.36, 2.08);
    return g;
  }
  function house(x, z, scale = 1, parent = root) {
    const g = new T.Group();
    parent.add(g);
    g.position.set(x, 0.05, z);
    g.scale.setScalar(scale);
    box(1.65, 1.3, 1.25, 0xefddb4, g, 0, 0.65);
    const roof = mesh(
      new T.ConeGeometry(1.38, 0.7, 4),
      PALETTE.roof,
      g,
      0,
      1.65,
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.8;
    box(0.36, 0.8, 0.05, 0x795637, g, 0, 0.4, 0.65);
    box(0.28, 0.3, 0.06, 0xedae58, g, -0.52, 0.8, 0.65);
    return g;
  }
  function rock(x, z, large = 1) {
    const r = mesh(
      new T.DodecahedronGeometry(0.45 * large, 0),
      0x73837d,
      root,
      x,
      0.28 * large,
      z,
    );
    r.scale.set(1, 0.9, 0.85);
    r.rotation.set(0.2, x, 0.1);
    return r;
  }
  function line(points, color = 0xffdf8c, r = 0.025, parent = root) {
    if (points.length < 2) return;
    const curve = new T.CurvePath();
    for (let i = 1; i < points.length; i++)
      curve.add(
        new T.LineCurve3(
          new T.Vector3(...points[i - 1]),
          new T.Vector3(...points[i]),
        ),
      );
    return mesh(
      new T.TubeGeometry(curve, Math.max(2, points.length * 3), r, 5, false),
      color,
      parent,
    );
  }
  function text(str, x, y, z) {
    const s = label(str);
    root.add(s);
    s.position.set(x, y, z);
    return s;
  }
  const floor = box(200, 0.2, 200, 0x83ab9c, scene, 0, -1.3);
  floor.castShadow = false;
  if (kind === "map") {
    floor.material.dispose();
    floor.material = new T.ShadowMaterial({ color: 0x183d31, opacity: 0.18 });
  }
  const pickables = [],
    tiles = [],
    dynamic = new T.Group();
  root.add(dynamic);
  let moving,
    cowActor,
    rotor,
    flour,
    inkMesh,
    inkTexture,
    bags = [],
    flowDots = [],
    waterFlow = [],
    mode = "play",
    lastData = {},
    phase = 0,
    disposed = false,
    raf = 0,
    visible = true,
    frames = 0;
  const at = ([x, z]) => [(x - 2) * 1.5, 0, (z - 1.5) * 1.5];
  const addPick = (o, data) => {
    o.userData.action = data;
    pickables.push(o);
    return o;
  };
  function paper(strokes, parent, x, y, z, w = 1.35) {
    const tx = makeInkTexture(strokes);
    const m = new T.MeshBasicMaterial({
      map: tx,
      transparent: true,
      side: T.DoubleSide,
      depthWrite: false,
    });
    const p = new T.Mesh(new T.PlaneGeometry(w, w * 0.6), m);
    p.position.set(x, y, z);
    parent.add(p);
    return [p, tx];
  }
  function makeMill(parent, x = 0, z = 0, scale = 1) {
    const g = new T.Group();
    parent.add(g);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    cyl(1.22, 1.32, 0.5, 0x7f8c7b, g, 0, 0.32);
    const top = new T.Group();
    g.add(top);
    top.position.y = 0.67;
    cyl(1.14, 1.14, 0.32, 0xb6b6a2, top);
    cyl(0.2, 0.2, 0.35, 0x53685c, top, 0, 0.08);
    for (let i = 0; i < 16; i++) {
      const groove = box(
        0.02,
        0.015,
        0.65,
        0x758476,
        top,
        Math.sin((i * Math.PI) / 8) * 0.72,
        0.17,
        Math.cos((i * Math.PI) / 8) * 0.72,
      );
      groove.rotation.y = (i * Math.PI) / 8 + 0.3;
    }
    const handle = box(1, 0.17, 0.18, PALETTE.wood, top, 1.45, 0.24);
    cyl(0.1, 0.1, 0.65, PALETTE.wood, top, 1.85, 0.48);
    const dot = cyl(0.1, 0.1, 0.03, 0xd7653f, top, 0, 0.185, -0.93);
    return { g, top, handle, dot };
  }
  function boat(parent, x = 0, z = 0) {
    const g = new T.Group();
    parent.add(g);
    g.position.set(x, 0.13, z);
    const hull = box(1.2, 0.23, 0.7, PALETTE.wood, g, 0, 0.1);
    const bow = mesh(
      new T.ConeGeometry(0.48, 0.65, 3),
      0x986b42,
      g,
      0.72,
      0.12,
    );
    bow.rotation.z = -Math.PI / 2;
    box(0.06, 1.4, 0.06, 0x825d37, g, 0, 0.83);
    return g;
  }
  if (kind === "cow" || kind === "sea") {
    const sea = kind === "sea";
    box(8.6, 0.65, 7.1, sea ? 0x427985 : 0x827158, root, 0, -0.5);
    box(8.5, 0.16, 7, sea ? 0x5eafb6 : 0xc5be8f, root, 0, -0.09);
    for (let z = 0; z < 4; z++)
      for (let x = 0; x < 5; x++) {
        const [px, , pz] = at([x, z]),
          soil = !sea && includes(COW_SOIL, [x, z]);
        const tile = box(
          1.44,
          0.07,
          1.44,
          sea ? 0x64b1b5 : soil ? 0xc7a574 : 0xaabd88,
          root,
          px,
          0,
          pz,
        );
        tiles.push({ tile, x, z, soil });
        addPick(tile, { type: "tile", x, z });
        if (includes(sea ? SEA_ROCK : COW_ROCK, [x, z])) {
          rock(px, pz, 1.2);
          rock(px + 0.3, pz - 0.2, 0.8);
          text(sea ? "礁石" : "石头", px, 1, pz);
        }
        if (!sea && includes(COW_SEED, [x, z])) {
          for (let j = 0; j < 3; j++) {
            const stalk = mesh(
              new T.ConeGeometry(0.13, 0.55, 4),
              0x3c7544,
              root,
              px + (j - 1) * 0.28,
              0.32,
              pz,
            );
            stalk.rotation.z = 0.15;
          }
          text("小苗", px, 1, pz);
        }
        if (soil) {
          for (let j = 0; j < 4; j++)
            box(
              1.22,
              0.025,
              0.025,
              0xa18658,
              root,
              px,
              0.05,
              pz + (j - 1.5) * 0.28,
            );
        }
      }
    for (let x = 0; x < 5; x++)
      text(["一", "二", "三", "四", "五"][x] + "列", (x - 2) * 1.5, 0.15, -3.3);
    for (let z = 0; z < 4; z++) {
      const l = text(
        ["一", "二", "三", "四"][z] + "行",
        -4.15,
        0.15,
        (z - 1.5) * 1.5,
      );
      l.scale.multiplyScalar(0.65);
    }
    text("出发处", -3, 0.8, 2.7);
    if (sea) {
      house(3, -2.25, 0.65);
      text("归岸处", 3, 1.8, -2.25);
      mesh(new T.ConeGeometry(0.64, 1.3, 5), 0xe1b651, root, 3, 0.65, 2.25);
      text("金山", 3, 1.7, 2.25);
      moving = boat(root);
      [inkMesh, inkTexture] = paper([], moving, 0, 1.05, 0.07, 1.15);
    } else {
      house(4.4, -2, 0.75);
      tree(-4.4, -2.8, 0.8);
      tree(4.6, 2.4, 0.85);
      moving = new T.Group();
      root.add(moving);
      cyl(0.55, 0.55, 0.08, 0xe4d6ae, moving, 0, 0.12);
      [inkMesh, inkTexture] = paper([], moving, 0, 0.75, 0.05, 1.5);
      cowActor = new T.Group();
      moving.add(cowActor);
      cowActor.visible = false;
      const body = mesh(
        new T.SphereGeometry(0.43, 16, 12),
        0x865a38,
        cowActor,
        0,
        0.64,
        0,
      );
      body.scale.set(1.25, 0.72, 0.67);
      const head = mesh(
        new T.SphereGeometry(0.25, 12, 10),
        0x68452e,
        cowActor,
        0.48,
        0.74,
        0,
      );
      head.scale.set(1.1, 0.85, 0.85);
      const nose = mesh(
        new T.SphereGeometry(0.16, 10, 8),
        0xb38b63,
        cowActor,
        0.69,
        0.68,
        0,
      );
      nose.scale.set(0.7, 0.65, 1.25);
      for (const x of [-0.3, 0.29])
        for (const z of [-0.18, 0.18])
          cyl(0.055, 0.065, 0.43, 0x68452e, cowActor, x, 0.28, z);
      for (const z of [-0.19, 0.19]) {
        const horn = mesh(
          new T.ConeGeometry(0.055, 0.26, 8),
          0xe6d8b7,
          cowActor,
          0.4,
          0.98,
          z,
        );
        horn.rotation.x = z > 0 ? 0.5 : -0.5;
        mesh(
          new T.SphereGeometry(0.028, 8, 6),
          0x202d27,
          cowActor,
          0.57,
          0.8,
          z,
        );
      }
      line(
        [
          [-0.48, 0.65, 0],
          [-0.7, 0.47, 0.05],
          [-0.7, 0.32, 0.06],
        ],
        0x68452e,
        0.025,
        cowActor,
      );
      box(0.12, 0.1, 0.73, 0xd0b17c, cowActor, 0.16, 0.86, 0);
    }
  } else if (kind === "mill") {
    box(8.4, 0.55, 6.6, 0x877d63, root, 0, -0.4);
    box(8.4, 0.1, 6.6, 0xc2baa0, root, 0, -0.06);
    for (let i = -3; i <= 3; i++)
      for (let j = -2; j <= 2; j++)
        box(
          0.95,
          0.025,
          0.95,
          (i + j) % 2 ? 0xb8b297 : 0xc8bfa5,
          root,
          i,
          0.01,
          j,
        );
    house(-2.9, -2, 0.85);
    tree(3.2, -2, 0.9);
    const m = makeMill(root, -0.6, 0, 1.25);
    rotor = m.top;
    addPick(m.handle, { type: "turn" });
    addPick(m.top.children[0], { type: "turn" });
    text("顺时针转动磨柄", -0.6, 2.4, 0);
    flour = cyl(0.35, 0.52, 0.23, 0xf5e4b5, root, 1.55, 0.14, 0.6);
    addPick(flour, { type: "grain" });
    [inkMesh, inkTexture] = paper([], root, 1.9, 0.65, 0.7, 1.4);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 2.3;
      const basket = cyl(0.56, 0.42, 0.48, 0xb98148, root, x, 0.25, 2.25);
      const fill = cyl(0.47, 0.35, 0.05, 0xf0d5a0, root, x, 0.51, 2.25);
      bags.push(fill);
      addPick(basket, { type: "bag", index: i });
      text(["鲁伯家 · 2人", "周婶家 · 3人", "阿婆家 · 1人"][i], x, 0.92, 2.65);
    }
  } else if (kind === "water") {
    box(10.2, 0.6, 6.6, 0x93836a, root, 0, -0.43);
    box(10.2, 0.15, 6.6, 0xb9b88a, root, 0, -0.055);
    cyl(0.6, 0.6, 0.07, 0x46a5b2, root, -4, 0.06, 1.25);
    text("水源", -4, 1, 1.25);
    house(0, -3.9, 0.85);
    box(1.88, 0.05, 1.62, 0xd5c49c, root, 0.06, 0.04, 0.37);
    text("门前要留路", 0, 0.8, 0.37);
    box(1.3, 0.06, 1.3, 0xa29c60, root, 4, 0.04, -1.5);
    for (let i = 0; i < 4; i++)
      box(1.15, 0.035, 0.045, 0x827c44, root, 4, 0.09, -1.9 + i * 0.27);
    text("田地", 4, 1, -1.5);
    tree(-4, -2.2, 0.9);
    tree(4.7, 2.5, 0.7);
  } else {
    box(15, 0.8, 9.7, 0x8d8066, root, 0, -0.65);
    box(15, 0.18, 9.7, 0xaeb68a, root, 0, -0.17);
    const riverPoints = [
      [-7, 0.02, 2],
      [-4, 0.02, 1.5],
      [-2, 0.02, 2.5],
      [1, 0.02, 2],
      [3, 0.02, 2.6],
      [7, 0.02, 2.4],
    ];
    line(riverPoints, 0x589e9d, 0.46);
    for (const [x, z, s] of [
      [-6, -3, 1],
      [0, -3.8, 1.1],
      [6, -3.5, 0.9],
      [1, 3.4, 0.7],
      [-7, 3.6, 0.75],
    ])
      tree(x, z, s);
    house(-3, -2, 1.15);
    house(1, -3, 0.8);
    house(-5, 0.1, 0.65);
    makeMill(root, 2.3, -0.5, 0.85);
    boat(root, 5.2, 2.4);
    for (let i = 0; i < 4; i++)
      box(1.1, 0.05, 1.5, 0xc5a874, root, -4.8 + i * 1.25, 0.02, -2.5);
    const spots = [
      ["water", -4, 1.5, "一笔清泉"],
      ["cow", -3.2, -2.3, "田里的好帮手"],
      ["mill", 2.3, -0.5, "石磨转起来"],
      ["sea", 5.2, 2.4, "借风回家"],
    ];
    for (const [id, x, z, title] of spots) {
      const ring = mesh(
        new T.TorusGeometry(0.75, 0.055, 6, 40),
        0xf8d88d,
        root,
        x,
        0.15,
        z,
      );
      ring.rotation.x = -Math.PI / 2;
      const hit = cyl(0.9, 0.9, 0.13, 0xd2c590, root, x, 0, z);
      hit.material = new T.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      addPick(hit, { type: "story", id });
      const l = text(title, x, 2, z);
      l.scale.multiplyScalar(1.15);
      addPick(l, { type: "story", id });
    }
    for (let i = 0; i < 8; i++) {
      const m = mesh(
        new T.ConeGeometry(2 + (i % 3), 3 + (i % 2), 5),
        i % 2 ? 0x6b9b90 : 0x83aaa1,
        root,
        -13 + i * 3.5,
        1,
        -11 - (i % 2) * 2,
      );
      m.rotation.y = i * 0.8;
    }
  }
  function disposeGroup(g) {
    g.traverse((o) => {
      o.geometry?.dispose();
      if (o.isSprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    g.clear();
  }
  function path3(points, y = 0.14) {
    return points.map((p) => [(p[0] - 400) / 80, y, (p[1] - 240) / 80]);
  }
  // Small landmarks help children hold their bearings while the camera moves.
  if (kind !== "sea") {
    const edge = kind === "map" ? 6.8 : 4.5;
    for (let i = 0; i < 16; i++) {
      const x = -edge + i * ((edge * 2) / 15),
        z = kind === "map" ? -4.2 : 3.05;
      for (let j = 0; j < 2; j++) {
        const blade = mesh(
          new T.ConeGeometry(0.05, 0.22 + (i % 3) * 0.05, 3),
          i % 2 ? 0x597f49 : 0x7f974b,
          root,
          x + j * 0.12,
          0.12,
          z,
        );
        blade.rotation.z = j ? 0.2 : -0.2;
      }
    }
  }
  if (kind === "cow") {
    for (let i = 0; i < 7; i++) {
      box(0.07, 0.55, 0.07, 0x937349, root, -4.2, 0.28, -2.8 + i * 0.8);
    }
    box(0.06, 0.06, 5, 0xb69769, root, -4.2, 0.42, -0.4);
  }
  if (kind === "sea") {
    for (let i = 0; i < 16; i++) {
      line(
        [
          [-3.6 + (i % 4) * 2.1, 0.09, -2.5 + Math.floor(i / 4) * 1.5],
          [-3.1 + (i % 4) * 2.1, 0.09, -2.5 + Math.floor(i / 4) * 1.5],
        ],
        0x9bd3cd,
        0.012,
      );
    }
  }
  const ray = new T.Raycaster(),
    ndc = new T.Vector2();
  let down = null;
  const millPlane = new T.Plane(new T.Vector3(0, 1, 0), -0.84);
  const point = new T.Vector3();
  function millAngle() {
    return ray.ray.intersectPlane(millPlane, point)
      ? Math.atan2(point.z, point.x + 0.6)
      : null;
  }
  function hit(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      1 - ((e.clientY - r.top) / r.height) * 2,
    );
    camera.updateMatrixWorld();
    root.updateMatrixWorld(true);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(pickables, false)[0]?.object.userData.action;
  }
  const pd = (e) => {
    if (e.button !== 0) return;
    const action = hit(e);
    down = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      turn: mode === "play" && action?.type === "turn",
      angle: millAngle(),
      sum: 0,
      turned: false,
    };
    canvas.setPointerCapture(e.pointerId);
  };
  const pu = (e) => {
    if (
      down &&
      !down.turned &&
      mode === "play" &&
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < 9
    ) {
      const a = hit(e);
      if (a) onAction(a);
    }
    down = null;
  };
  const move = (e) => {
    if (!down?.turn || mode !== "play") return;
    hit(e);
    const a = millAngle();
    if (a === null || down.angle === null) return;
    let delta = a - down.angle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    down.sum += delta;
    down.angle = a;
    if (down.sum >= Math.PI * 0.47) {
      down.sum -= Math.PI / 2;
      down.turned = true;
      onAction({ type: "turn" });
    }
  };
  const cancel = () => (down = null);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", pd);
  canvas.addEventListener("pointerup", pu);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("lostpointercapture", cancel);
  const lost = (e) => {
    e.preventDefault();
    onError();
  };
  canvas.addEventListener("webglcontextlost", lost);
  let fit = 1;
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    const nextFit = Math.max(1, 1.2 / camera.aspect);
    camera.position.multiplyScalar(nextFit / fit);
    fit = nextFit;
    camera.updateProjectionMatrix();
    frames = 0;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
  });
  io.observe(host);
  function view(v) {
    const map = kind === "map",
      mill = kind === "mill";
    const d = map ? 1.55 : mill ? 0.9 : 1;
    camera.position.set(
      ...(v === "top"
        ? [0, 16 * d, 0.01]
        : v === "front"
          ? [0, 8 * d, 12 * d]
          : [8 * d, 10 * d, 12 * d]),
    );
    camera.position.multiplyScalar(fit);
    controls.target.set(0, 0.2, 0);
    controls.update();
    camera.updateMatrixWorld();
    host.dataset.view = v;
  }
  view("angle");
  resize();
  function update(data) {
    lastData = data;
    quiet = !!data.quiet;
    const b = data.b || {};
    if (cowActor) {
      cowActor.visible = b.actor === "ox";
      inkMesh.visible = !cowActor.visible;
    }
    host.dataset.inkStrokes = String(b.strokes?.length || 0);
    if (inkMesh) {
      inkTexture?.dispose();
      inkTexture = makeInkTexture(b.strokes || []);
      inkMesh.material.map = inkTexture;
      inkMesh.material.needsUpdate = true;
    }
    disposeGroup(dynamic);
    const trace = data.result?.trace?.slice(0, (data.frame || 0) + 1) || [
      [0, 3],
    ];
    if (moving && !data.result) {
      const preview =
        kind === "cow" ? cowTrial(b.route || []) : seaTrial(b.sail || []);
      if (preview.trace.length > 1) {
        line(
          preview.trace.map((p) => {
            const [x, , z] = at(p);
            return [x, 0.18, z];
          }),
          0xf5ce70,
          0.022,
          dynamic,
        );
        const [x, , z] = at(preview.trace.at(-1));
        const ring = mesh(
          new T.TorusGeometry(0.38, 0.05, 6, 24),
          0xe8a853,
          dynamic,
          x,
          0.21,
          z,
        );
        ring.rotation.x = -Math.PI / 2;
      }
    }
    if (moving) {
      const pos = trace.at(-1) || [0, 3];
      const [x, , z] = at(pos);
      moving.position.set(x, 0.12, z);
      if (cowActor?.visible && trace.length > 1) {
        const prev = trace.at(-2);
        moving.rotation.y = -Math.atan2(pos[1] - prev[1], pos[0] - prev[0]);
      }
      if (trace.length > 1)
        line(
          trace.map((p) => {
            const [x, , z] = at(p);
            return [x, 0.14, z];
          }),
          0xffdf8c,
          0.035,
          dynamic,
        );
    }
    for (const c of tiles) {
      if (c.soil)
        c.tile.material = mat(
          includes(b.covered || trace, [c.x, c.z]) ? 0x98633e : 0xc7a574,
        );
    }
    if (rotor) {
      rotor.rotation.y = (-(b.quarters || 0) * Math.PI) / 2;
      for (let i = 0; i < 3; i++)
        bags[i].scale.y = 1 + (b.bags?.[i] || 0) * 0.4;
      flour.visible =
        (b.quarters || 0) * 3 - (b.bags || []).reduce((a, n) => a + n, 0) > 0;
    }
    if (kind === "water") {
      for (const s of b.strokes || [])
        line(path3(s.points, 0.1), 0x4d7071, 0.025, dynamic);
      waterFlow = (data.result?.flow || []).filter((f) => f.a && f.b);
      for (const f of waterFlow)
        line(path3([f.a, f.b], 0.15), 0x4cc7da, 0.05, dynamic);
      flowDots = [];
      for (let i = 0; i < Math.min(waterFlow.length, 36); i++) {
        const dot = mesh(new T.SphereGeometry(0.065, 6, 4), 0xe6f8db, dynamic);
        flowDots.push(dot);
      }
      if (b.bridge?.tested) {
        box(1.1, 0.16, 0.6, 0x96734f, dynamic, 0.1, 0.22, 0.9);
        for (let i = 0; i < 5; i++)
          box(0.07, 0.06, 0.6, 0xe3c58f, dynamic, -0.38 + i * 0.24, 0.34, 0.9);
      }
    }
    host.dataset.result = String(!!data.result?.ok);
  }
  function frame(time) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (!quiet || frames < 2 || phase !== lastData) {
      const t = time * 0.001;
      if (kind === "sea" && moving && !quiet)
        moving.position.y = 0.16 + Math.sin(t * 1.8) * 0.025;
      for (let i = 0; i < flowDots.length; i++) {
        const f = waterFlow[i];
        const q = quiet ? 1 : (t * 0.4 + i * 0.11) % 1;
        const v = path3(
          [[f.a[0] + (f.b[0] - f.a[0]) * q, f.a[1] + (f.b[1] - f.a[1]) * q]],
          0.23,
        )[0];
        flowDots[i].position.set(...v);
      }
      if (inkMesh) inkMesh.quaternion.copy(camera.quaternion);
      renderer.render(scene, camera);
      frames++;
      phase = lastData;
      host.dataset.frames = String(frames);
    }
  }
  const changed = () => {
    frames = 0;
  };
  controls.addEventListener("change", changed);
  const baseUpdate = update;
  raf = requestAnimationFrame(frame);
  host.dataset.renderer = "webgl";
  onReady();
  return {
    update(data) {
      baseUpdate(data);
      frames = 0;
    },
    view(v) {
      view(v);
      frames = 0;
    },
    mode(m) {
      mode = m;
      controls.enabled = m === "orbit";
      canvas.style.cursor = m === "orbit" ? "grab" : "pointer";
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("pointerdown", pd);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", pu);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
      const geos = new Set(),
        mats = new Set(),
        textures = new Set();
      scene.traverse((o) => {
        if (o.geometry) geos.add(o.geometry);
        for (const m of o.material
          ? Array.isArray(o.material)
            ? o.material
            : [o.material]
          : []) {
          mats.add(m);
          if (m.map) textures.add(m.map);
        }
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      inkTexture?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

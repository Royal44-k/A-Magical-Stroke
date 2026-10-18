export const KEY = "maliang-qihuan-v2";
export const CHAPTERS = [
  ["brush", "雨夜，画一把伞"],
  ["river", "给水画一条路"],
  ["offer", "画笔交给谁"],
  ["handoff", "交给下一双手"],
  ["ending", "看看这一回"],
];
export const COLORS = ["#215d69", "#bd5938", "#d09a34", "#527c4b"];
export const STEPS = [
  ["check", "看看支架和水路"],
  ["pump", "开始提水"],
  ["stop", "停下水车"],
  ["pack", "收好工具"],
];
export const SOURCE = [80, 340],
  FIELD = [720, 120],
  DOOR = { x: 330, y: 205, w: 150, h: 130 };
export const freshPractice = () => ({
  rules: 22,
  active: false,
  checked: [],
  running: false,
  arrived: false,
  packed: [],
  legacy: false,
});
export const TOOLS = [
  ["bucket", "水桶"],
  ["rope", "绳子"],
  ["ruler", "木尺"],
];
export const fresh = () => ({
  version: 2,
  chapter: "home",
  resume: "brush",
  visited: [],
  canopy: { strokes: [], tests: [], result: null },
  river: {
    strokes: [],
    tests: [],
    result: null,
    power: "",
    support: false,
    bridge: {
      left: false,
      right: false,
      deck: false,
      horizontal: true,
      tested: false,
    },
  },
  offer: {
    read: false,
    choice: null,
    links: {},
    agreed: false,
    exclusive: false,
  },
  handoff: {
    lead: "",
    backup: "",
    order: ["pump", "check", "pack", "stop"],
    step: 0,
    practice: freshPractice(),
    done: false,
    message: "",
  },
  endings: [],
  note: "",
  quiet: false,
});
const finite = (x, min, max) => Number.isFinite(x) && x >= min && x <= max;
export function validStrokes(v) {
  return (
    Array.isArray(v) &&
    v.length <= 60 &&
    v.every(
      (s) =>
        s &&
        COLORS.includes(s.color) &&
        [5, 9, 14].includes(s.width) &&
        Array.isArray(s.points) &&
        s.points.length >= 1 &&
        s.points.length <= 500 &&
        s.points.every(
          (p) =>
            Array.isArray(p) &&
            p.length === 2 &&
            p.every((n, i) => finite(n, 0, i ? 480 : 800)),
        ),
    )
  );
}
function validResult(kind, r) {
  if (
    !r ||
    typeof r.ok !== "boolean" ||
    typeof r.message !== "string" ||
    r.message.length > 600
  )
    return false;
  if (kind === "canopy")
    return (
      Number.isInteger(r.dry) &&
      r.dry >= 0 &&
      r.dry <= 7 &&
      Array.isArray(r.drops) &&
      r.drops.length === 7 &&
      r.drops.every(
        (d) =>
          finite(d.x, 0, 800) &&
          finite(d.y, 0, 480) &&
          typeof d.stopped === "boolean",
      )
    );
  return (
    typeof r.arrived === "boolean" &&
    (r.flow === undefined ||
      (Array.isArray(r.flow) &&
        r.flow.length <= 4802 &&
        r.flow.every(
          (f) =>
            [f.a, f.b].every(
              (p) =>
                Array.isArray(p) &&
                p.length === 2 &&
                p.every((v, i) => finite(v, 0, i ? 480 : 800)),
            ) &&
            finite(f.t0, 0, 1) &&
            finite(f.t1, 0, 1) &&
            f.t1 >= f.t0,
        ))) &&
    (r.doorHit === undefined ||
      r.doorHit === null ||
      (Array.isArray(r.doorHit) &&
        r.doorHit.length === 2 &&
        r.doorHit.every((v, i) => finite(v, 0, i ? 480 : 800)))) &&
    Array.isArray(r.path) &&
    r.path.length <= 2401 &&
    r.path.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        p.every((v, i) => finite(v, 0, i ? 480 : 800)),
    ) &&
    (r.blocked === undefined || typeof r.blocked === "boolean")
  );
}
export function restore(raw) {
  try {
    const s = JSON.parse(raw);
    if (
      s?.version !== 2 ||
      !["home", ...CHAPTERS.map((c) => c[0])].includes(s.chapter)
    )
      return null;
    if (
      !validStrokes(s.canopy?.strokes) ||
      !validStrokes(s.river?.strokes) ||
      !Array.isArray(s.canopy.tests) ||
      !Array.isArray(s.river.tests) ||
      s.canopy.tests.length > 12 ||
      s.river.tests.length > 12
    )
      return null;
    for (const section of ["canopy", "river"])
      if (
        s[section].tests.some(
          (t) => !validStrokes(t.strokes) || !validResult(section, t.result),
        )
      )
        return null;
    if (
      !["", "wheel", "people"].includes(s.river.power) ||
      typeof s.river.support !== "boolean" ||
      !s.river.bridge ||
      ["left", "right", "deck", "horizontal", "tested"].some(
        (k) => typeof s.river.bridge[k] !== "boolean",
      )
    )
      return null;
    if (
      !s.offer ||
      ![null, "accept", "refuse", "talk"].includes(s.offer.choice) ||
      typeof s.offer.read !== "boolean" ||
      typeof s.offer.agreed !== "boolean" ||
      !s.offer.links ||
      Object.entries(s.offer.links).some(
        ([k, v]) =>
          !["field", "door", "tomorrow"].includes(k) ||
          !["share", "path", "teach"].includes(v),
      )
    )
      return null;
    if (
      !s.handoff ||
      !["", "鲁伯", "周婶", "陈叔"].includes(s.handoff.lead) ||
      !["", "鲁伯", "周婶", "陈叔"].includes(s.handoff.backup) ||
      !Array.isArray(s.handoff.order) ||
      s.handoff.order.length !== 4 ||
      new Set(s.handoff.order).size !== 4 ||
      s.handoff.order.some((x) => !STEPS.some(([id]) => id === x)) ||
      !Number.isInteger(s.handoff.step) ||
      !finite(s.handoff.step, 0, 4) ||
      typeof s.handoff.done !== "boolean"
    )
      return null;
    if (
      !Array.isArray(s.visited) ||
      s.visited.some((c) => !CHAPTERS.some(([id]) => id === c)) ||
      !Array.isArray(s.endings) ||
      s.endings.some((x) => !["E1", "E2", "E3", "E4"].includes(x)) ||
      typeof s.note !== "string" ||
      s.note.length > 400 ||
      typeof s.quiet !== "boolean"
    )
      return null;
    if (typeof s.offer.exclusive !== "boolean")
      s.offer.exclusive = s.offer.choice === "accept" && !s.offer.agreed;
    if (s.offer.agreed && !agreementReady(s.offer)) return null;
    if (
      s.handoff.done &&
      (s.handoff.step !== 4 ||
        s.handoff.order.some((id, i) => id !== STEPS[i][0]) ||
        !s.handoff.lead ||
        s.handoff.lead === s.handoff.backup)
    )
      return null;
    if (s.handoff.step === 4 && !s.handoff.done) return null;
    if (
      s.handoff.step > 0 &&
      (!s.handoff.lead ||
        !s.handoff.backup ||
        s.handoff.lead === s.handoff.backup ||
        s.handoff.order
          .slice(0, s.handoff.step)
          .some((id, i) => id !== STEPS[i][0]))
    )
      return null;
    if (typeof s.handoff.message !== "string") return null;
    for (const k of ["canopy", "river"])
      if (s[k].result !== null && !validResult(k, s[k].result)) return null;
    s.resume = CHAPTERS.some(([id]) => id === s.resume)
      ? s.resume
      : s.visited.at(-1) || "brush";
    if (s.river.result && s.river.result.rules !== 21) {
      const checked = riverResult(s.river);
      if (s.river.result.ok && !checked.ok) {
        s.river.result = null;
        s.river.needsRetest = true;
        s.handoff = {
          ...s.handoff,
          step: 0,
          practice: freshPractice(),
          done: false,
          message: "这张图还有一条支路。请再试一次，看看门前。",
        };
      } else s.river.result = checked;
    }
    if (!s.handoff.practice) {
      s.handoff.practice = { ...freshPractice(), legacy: s.handoff.done };
      if (!s.handoff.done) {
        s.handoff.step = 0;
        s.handoff.message = "纸牌还在，带小禾到画前试一遍吧。";
      }
    } else {
      const p = s.handoff.practice;
      if (
        p.rules !== 22 ||
        ["active", "running", "arrived", "legacy"].some(
          (k) => typeof p[k] !== "boolean",
        ) ||
        !Array.isArray(p.checked) ||
        p.checked.length > 3 ||
        new Set(p.checked).size !== p.checked.length ||
        p.checked.some((k) => !["support", "route", "door"].includes(k)) ||
        !Array.isArray(p.packed) ||
        p.packed.length > 3 ||
        new Set(p.packed).size !== p.packed.length ||
        p.packed.some((k) => !TOOLS.some(([id]) => id === k))
      )
        return null;
      if (
        !p.legacy &&
        ((s.handoff.step > 0 && p.checked.length !== 3) ||
          (s.handoff.step >= 3 && (!p.arrived || p.running)) ||
          (s.handoff.done && p.packed.length !== 3) ||
          (p.running && s.handoff.step !== 2) ||
          (p.packed.length && s.handoff.step < 3))
      )
        return null;
      if (p.legacy && !s.handoff.done) return null;
    }
    return s;
  } catch {
    return null;
  }
}
export function go(s, chapter) {
  if (!CHAPTERS.some(([id]) => id === chapter)) return s;
  return {
    ...s,
    chapter,
    resume: chapter,
    visited: [...new Set([...s.visited, chapter])],
  };
}
export function draw(s, kind, strokes) {
  if (!["canopy", "river"].includes(kind) || !validStrokes(strokes)) return s;
  return {
    ...s,
    ...(kind === "river"
      ? {
          handoff: {
            ...s.handoff,
            step: 0,
            practice: freshPractice(),
            done: false,
            message: "水路换了，请小禾照着新画再试一次。",
          },
        }
      : {}),
    [kind]: {
      ...s[kind],
      strokes: structuredClone(strokes),
      result: null,
      needsRetest: false,
      ...(kind === "river"
        ? { bridge: { ...s.river.bridge, tested: false } }
        : {}),
    },
  };
}
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function canopyResult(strokes) {
  const drops = Array.from({ length: 7 }, (_, i) => ({
    x: 250 + i * 50,
    y: 380,
    stopped: false,
  }));
  for (const d of drops) {
    for (const s of strokes)
      for (let i = 1; i < s.points.length; i++) {
        const a = s.points[i - 1],
          b = s.points[i];
        if (
          d.x < Math.min(a[0], b[0]) - s.width / 2 ||
          d.x > Math.max(a[0], b[0]) + s.width / 2
        )
          continue;
        const t =
            a[0] === b[0]
              ? a[1] <= b[1]
                ? 0
                : 1
              : Math.max(0, Math.min(1, (d.x - a[0]) / (b[0] - a[0]))),
          y = a[1] + t * (b[1] - a[1]);
        if (y > 50 && y < 320 && y < d.y) {
          d.y = y;
          d.stopped = true;
        }
      }
  }
  const dry = drops.filter((d) => d.stopped).length;
  return {
    ok: dry === 7,
    dry,
    drops,
    message: !strokes.length
      ? "先画一笔，再让雨落下来。"
      : dry === 7
        ? "雨滴被你的伞面挡住了，画纸还是干的！"
        : dry === 0
          ? "雨滴还落在纸上。把伞面画在画纸上方，再试一试。"
          : (drops.find((d) => !d.stopped).x < 400 ? "左边" : "右边") +
            "还有雨滴落下来。让伞面再宽一些。",
  };
}
function resample(strokes) {
  const nodes = [],
    edges = [],
    segments = [],
    origins = [];
  for (const [strokeIndex, s] of strokes.entries()) {
    let last = -1;
    for (let i = 0; i < s.points.length; i++) {
      const a = i ? s.points[i - 1] : s.points[i],
        b = s.points[i],
        n = i ? Math.max(1, Math.ceil(distance(a, b) / 14)) : 1;
      for (let j = i ? 1 : 0; j <= n; j++) {
        if (!i && j > 0) break;
        const t = i ? j / n : 0,
          p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        if (nodes.length > 2400) return { nodes: [], edges: [], tooMany: true };
        const id = nodes.length;
        nodes.push(p);
        origins.push(strokeIndex);
        edges.push([]);
        if (last >= 0) {
          segments.push([last, id]);
          edges[id].push(last);
          edges[last].push(id);
        }
        last = id;
      }
    }
  }
  return { nodes, edges, segments, origins };
}
export function riverResult(r) {
  if (!r.strokes.length)
    return {
      ok: false,
      arrived: false,
      path: [],
      message: "先从出水口画一条线，看看它会走到哪里。",
    };
  if (!r.support)
    return {
      ok: false,
      arrived: false,
      path: [],
      message: "水还没提起来。请鲁伯先把支架装稳。",
    };
  if (!r.power)
    return {
      ok: false,
      arrived: false,
      path: [],
      message: "选一个提水办法，再让水走一走。",
    };
  const { nodes, edges, segments, origins, tooMany } = resample(r.strokes);
  if (tooMany)
    return {
      ok: false,
      arrived: false,
      path: [],
      message: "这张图的线太密了。收起几笔，给水留一条清楚的路。",
    };
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      if (distance(nodes[i], nodes[j]) <= 19) {
        edges[i].push(j);
        edges[j].push(i);
      }
  const starts = nodes
    .map((p, i) => (distance(p, SOURCE) <= 38 ? i : -1))
    .filter((i) => i >= 0);
  if (!starts.length)
    return {
      ok: false,
      arrived: false,
      path: [],
      message: "出水口还没接上线。从左边的蓝圆圈接着画。",
    };
  const prev = Array(nodes.length).fill(-2),
    queue = [...starts],
    depth = Array(nodes.length).fill(-1);
  for (const i of starts) {
    prev[i] = -1;
    depth[i] = 0;
  }
  let goal = -1,
    best = starts[0];
  for (let n = 0; n < queue.length; n++) {
    const i = queue[n];
    if (distance(nodes[i], FIELD) < distance(nodes[best], FIELD)) best = i;
    if (goal < 0 && distance(nodes[i], FIELD) <= 38) goal = i;
    for (const j of edges[i])
      if (prev[j] === -2) {
        prev[j] = i;
        depth[j] = depth[i] + 1;
        queue.push(j);
      }
  }
  const path = [];
  for (let i = goal >= 0 ? goal : best; i !== -1; i = prev[i])
    path.push(nodes[i]);
  path.reverse();
  const reached = segments.filter(([a, b]) => depth[a] >= 0 && depth[b] >= 0),
    maxDepth = Math.max(1, ...depth) + 1;
  const visible = [...reached];
  for (let i = 0; i < prev.length; i++)
    if (prev[i] >= 0 && origins[i] !== origins[prev[i]])
      visible.push([prev[i], i]);
  const flow = visible.map(([i, j]) => {
    const a = depth[i] <= depth[j] ? i : j,
      b = a === i ? j : i;
    return {
      a: nodes[a],
      b: nodes[b],
      t0: Math.min(depth[a], depth[b]) / maxDepth,
      t1: (Math.max(depth[a], depth[b]) + 1) / maxDepth,
    };
  });
  const doorHit =
    reached
      .map(([a, b]) => doorIntersection(nodes[a], nodes[b]))
      .find(Boolean) || null;
  const arrived = goal >= 0,
    blocked = !!doorHit && !r.bridge.tested;
  return {
    rules: 21,
    ok: arrived && !blocked,
    arrived,
    blocked,
    path,
    flow,
    doorHit,
    message: blocked
      ? arrived
        ? "水到田边了！可是门前也有水流过，大家还过不去。"
        : "水还没到田边，门前的路也被挡住了。可以先改一改门前这段水路。"
      : !arrived
        ? "水在这里停下了。看看断开的两头，再添一笔。"
        : "水顺着你画的路到了田边，门前也能走了！",
  };
}
export function doorIntersection(a, b) {
  let lo = 0,
    hi = 1;
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - DOOR.x],
    [dx, DOOR.x + DOOR.w - a[0]],
    [-dy, a[1] - DOOR.y],
    [dy, DOOR.y + DOOR.h - a[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
    if (lo > hi) return null;
  }
  const t = (lo + hi) / 2;
  return [a[0] + dx * t, a[1] + dy * t];
}
export function flowFrame(result, progress = 1) {
  const t = Math.max(0, Math.min(1, progress));
  const flow =
    result?.flow ||
    (result?.path || []).slice(1).map((b, i) => ({
      a: result.path[i],
      b,
      t0: i / result.path.length,
      t1: (i + 1) / result.path.length,
    }));
  let d = "";
  const heads = [];
  for (const f of flow) {
    if (t < f.t0) continue;
    const done = Math.min(1, (t - f.t0) / Math.max(0.0001, f.t1 - f.t0)),
      p = [
        f.a[0] + (f.b[0] - f.a[0]) * done,
        f.a[1] + (f.b[1] - f.a[1]) * done,
      ];
    d += "M" + f.a.join(",") + "L" + p.join(",");
    if (done < 1 && heads.length < 8 && heads.every((h) => distance(h, p) > 22))
      heads.push(p);
  }
  return { d, heads };
}

export function testDrawing(s, kind) {
  const result =
    kind === "canopy" ? canopyResult(s.canopy.strokes) : riverResult(s.river);
  return {
    ...s,
    [kind]: {
      ...s[kind],
      result,
      needsRetest: false,
      tests: [
        ...s[kind].tests,
        {
          strokes: structuredClone(s[kind].strokes),
          result: structuredClone(result),
          ...(kind === "river"
            ? {
                conditions: {
                  support: s.river.support,
                  power: s.river.power,
                  bridge: structuredClone(s.river.bridge),
                },
              }
            : {}),
        },
      ].slice(-12),
    },
  };
}
export function prepareRiver(s, patch) {
  return {
    ...s,
    river: { ...s.river, ...patch, result: null },
    handoff: {
      ...s.handoff,
      step: 0,
      practice: freshPractice(),
      done: false,
      message: "准备换了，请小禾从头试一回。",
    },
  };
}
export function arrangeBridge(s, patch) {
  return {
    ...s,
    handoff: {
      ...s.handoff,
      step: 0,
      practice: freshPractice(),
      done: false,
      message: "小桥换了，请小禾从头试一回。",
    },
    river: {
      ...s.river,
      result: null,
      bridge: { ...s.river.bridge, ...patch, tested: false },
    },
  };
}
export function testBridge(s) {
  const b = s.river.bridge,
    ok = b.left && b.right && b.deck && b.horizontal;
  return {
    ...s,
    river: { ...s.river, result: null, bridge: { ...b, tested: ok } },
  };
}
export const MATCHES = { field: "share", door: "path", tomorrow: "teach" };
export const agreementReady = (o) =>
  Object.entries(MATCHES).every(([k, v]) => o.links[k] === v);
export function setOffer(s, choice) {
  return {
    ...s,
    offer: {
      ...s.offer,
      choice,
      agreed: false,
      exclusive: choice === "accept" || s.offer.exclusive,
    },
  };
}
export function confirmAgreement(s) {
  return s.offer.choice === "talk" && agreementReady(s.offer)
    ? { ...s, offer: { ...s.offer, agreed: true, exclusive: false } }
    : s;
}
export function arrange(s, order) {
  if (
    !Array.isArray(order) ||
    order.length !== 4 ||
    new Set(order).size !== 4 ||
    order.some((id) => !STEPS.some(([k]) => k === id))
  )
    return s;
  return {
    ...s,
    handoff: {
      ...s.handoff,
      order,
      step: 0,
      practice: freshPractice(),
      done: false,
      message: "纸牌换好了。请小禾从头试一回。",
    },
  };
}
export function setHandoffPerson(s, key, value) {
  if (
    !["lead", "backup"].includes(key) ||
    !["", "鲁伯", "周婶", "陈叔"].includes(value)
  )
    return s;
  return {
    ...s,
    handoff: {
      ...s.handoff,
      [key]: value,
      step: 0,
      done: false,
      practice: freshPractice(),
      message: "换好人了。请从第一张开始试。",
    },
  };
}
export function handoffStep(s) {
  const h = s.handoff;
  if (!h.lead || !h.backup || h.lead === h.backup)
    return {
      ...s,
      handoff: { ...h, message: "先选两位不同的大人，一位带头，一位接手。" },
    };
  if (h.done) return s;
  if (h.order[h.step] !== STEPS[h.step][0])
    return {
      ...s,
      handoff: {
        ...h,
        message: [
          "还没看支架，先别提水。",
          "水还没提起来，先看看下一张。",
          "水还在流，先停下来。",
          "水停下了，还要收好工具。",
        ][h.step],
      },
    };
  return {
    ...s,
    handoff: {
      ...h,
      practice: { ...(h.practice || freshPractice()), active: true },
      message: [
        "请指给我看：支架、水路、门前，都怎么样？",
        "请大人开始提水，我们一起看水往哪里走。",
        "看见田边到水以后，再请大人停水。",
        "把用过的三样工具放进篮子，下一位就能接着用。",
      ][h.step],
    },
  };
}
export function handoffAction(s, action, value) {
  const h = s.handoff,
    p = h.practice;
  if (!p || h.done || !h.lead || !h.backup || h.lead === h.backup) return s;
  const patch = (hp, pp, message) => ({
    ...s,
    handoff: { ...h, ...hp, practice: { ...p, ...pp }, message },
  });
  const r = riverResult(s.river);
  if (action === "arrive")
    return p.running && h.step === 2 && r.ok
      ? patch({}, { arrived: true }, "水到田边啦！请大人停下水车，再收工具。")
      : s;
  if (!p.active || h.order[h.step] !== STEPS[h.step][0]) return s;
  if (
    action === "inspect" &&
    h.step === 0 &&
    ["support", "route", "door"].includes(value)
  ) {
    const checked = [...new Set([...p.checked, value])];
    const message =
      value === "support"
        ? s.river.support
          ? "鲁伯已经装稳支架。再看看水路和门前。"
          : "支架还没装稳。先回水边请鲁伯帮忙。"
        : value === "route"
          ? r.arrived
            ? "这条水路能把水送到田边。"
            : "水路还没接到田边。回水边再画一画、试一试。"
          : r.blocked && !s.river.bridge.tested
            ? "门前有水挡路。回水边绕一绕，或拼好小桥再试。"
            : "门前留出了能走的路。";
    if (checked.length === 3) {
      if (!s.river.result?.ok || !r.ok)
        return patch(
          {},
          { checked },
          "三处都看过了，但这张水路还没试好。先回水边改一改，再带我来试。",
        );
      return patch(
        { step: 1 },
        { checked, active: false },
        "支架稳了，水路通了，门前也能走。下一步做什么？",
      );
    }
    return patch({}, { checked }, message);
  }
  if (
    action === "start" &&
    h.step === 1 &&
    p.checked.length === 3 &&
    r.ok &&
    s.river.result?.ok
  )
    return patch(
      { step: 2 },
      { running: true, arrived: false, active: false },
      "水车转起来了！看看水有没有走到田边。",
    );
  if (action === "stop" && h.step === 2 && p.running) {
    if (!p.arrived)
      return patch(
        { step: 1 },
        { running: false, active: false },
        "水还没到田边就停了。再提一次，看看水走到哪里。",
      );
    return patch(
      { step: 3 },
      { running: false, active: false },
      "田边已经到水，水车也停稳了。现在可以收工具了。",
    );
  }
  if (
    action === "pack" &&
    h.step === 3 &&
    !p.running &&
    p.arrived &&
    TOOLS.some(([id]) => id === value)
  ) {
    const packed = [...new Set([...p.packed, value])],
      done = packed.length === 3;
    return patch(
      done ? { step: 4, done: true } : {},
      { packed, active: !done },
      done
        ? "三样工具收好了，下回找起来就方便了。下一位可以照着做！"
        : TOOLS.find(([id]) => id === value)[1] +
            "收好了。再看看还有什么没收好。",
    );
  }
  return s;
}
export function handoffRecord(s) {
  const h = s.handoff,
    p = h.practice;
  if (p?.legacy)
    return "上次的交接已完成。还可以从第一张开始，带小禾再试一遍。";
  if (!p) return "交接还没有试完。";
  const checked =
    p.checked
      .map((k) => ({ support: "支架", route: "水路", door: "门前" })[k])
      .join("、") || "还没查看";
  const packed =
    p.packed
      .map((k) => TOOLS.find(([id]) => id === k)?.[1])
      .filter(Boolean)
      .join("、") || "还没收好";
  return (
    "看过：" +
    checked +
    "。" +
    (p.arrived ? "田边已经到水。" : "田边还没有试到水。") +
    (p.running ? "水车还在转。" : "水车已停。") +
    "收好：" +
    packed +
    "。"
  );
}
export function ending(s) {
  if (s.offer.exclusive) return "E3";
  if (!s.river.result?.ok || !s.handoff.done) return "E4";
  return s.endings.some((e) => e === "E3" || e === "E4") ? "E2" : "E1";
}
export function finish(s) {
  const id = ending(s);
  return { ...go(s, "ending"), endings: [...s.endings, id].slice(-12) };
}
export const ENDINGS = {
  E1: [
    "大家都会用了",
    "你的画把水送到了田边。做法也留了下来，下一双手能接着做。",
  ],
  E2: [
    "这一笔，补好了",
    "原来的问题没有藏起来。你回去添了一笔，也把办法改得更周全。",
  ],
  E3: [
    "木牌还挡在路上",
    "粮袋留下了，“签了才准用水”的条件也留下了。水路画通以后，这句话还要重新商量。",
  ],
  E4: [
    "还有一处，等你来画",
    "这一回先停在这里。看看水路和交接，带着一个具体问题再试。",
  ],
};
export const escapeHtml = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const strokesSvg = (strokes) =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480"><rect width="800" height="480" fill="#faf6ec"/>' +
  strokes
    .map((s) =>
      s.points.length === 1
        ? '<circle cx="' +
          s.points[0][0] +
          '" cy="' +
          s.points[0][1] +
          '" r="' +
          s.width / 2 +
          '" fill="' +
          s.color +
          '"/>'
        : '<polyline points="' +
          s.points.map((p) => p.join(",")).join(" ") +
          '" fill="none" stroke="' +
          s.color +
          '" stroke-width="' +
          s.width +
          '" stroke-linecap="round" stroke-linejoin="round"/>',
    )
    .join("") +
  "</svg>";
export function albumHtml(s) {
  const id = ending(s);
  return (
    '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>我的奇幻一笔</title><style>body{max-width:860px;margin:auto;padding:24px;background:#faf6ec;color:#163d48;font:18px/1.8 "Microsoft YaHei",sans-serif}h1,h2{font-family:KaiTi,serif}svg{width:100%;border:1px solid #a7b5a7}article{margin:30px 0}p{white-space:pre-wrap;overflow-wrap:anywhere}@media print{article{break-inside:avoid}}</style><h1>我的奇幻一笔</h1><p>这些线，是我亲手画的。</p>' +
    [
      ["canopy", "雨夜的伞"],
      ["river", "我画的水路"],
    ]
      .map(
        ([k, title]) =>
          "<article><h2>" +
          title +
          "</h2>" +
          strokesSvg(s[k].strokes) +
          "<p>" +
          escapeHtml(s[k].result?.message || "这张画还没有试过。") +
          "</p><details><summary>翻看试过的画</summary>" +
          s[k].tests
            .map(
              (t, i) =>
                "<h3>第" +
                (i + 1) +
                "张记录</h3>" +
                trialSvg(k, t) +
                "<p>" +
                escapeHtml(t.result.message) +
                "</p><p>" +
                escapeHtml(trialConditions(t)) +
                "</p>",
            )
            .join("") +
          "</details></article>",
      )
      .join("") +
    "<h2>" +
    (s.endings.length ? ENDINGS[id][0] : "故事还在继续") +
    "</h2><p>" +
    escapeHtml(s.note || "我还想把这幅画的故事说给你听。") +
    "</p><p>带头：" +
    escapeHtml(s.handoff.lead || "还没选") +
    "；接手：" +
    escapeHtml(s.handoff.backup || "还没选") +
    "</p><h2>交给下一双手</h2><p>" +
    escapeHtml(handoffRecord(s)) +
    "</p></html>"
  );
}

export function trialSvg(kind, t) {
  const ink = strokesSvg(t.strokes)
    .replace(/^[\s\S]*?<rect[^>]*\/>/, "")
    .replace("</svg>", "");
  const guides =
    kind === "canopy"
      ? '<rect x="225" y="365" width="350" height="80" rx="5" fill="#e9ddbd"/><rect x="250" y="350" width="300" height="65" fill="#fffdf3" stroke="#c4b58e"/><text x="400" y="390" text-anchor="middle">画纸</text>'
      : '<path d="M0 300 Q55 280 105 325 L105 480 H0Z" fill="#c5e2dc"/><circle cx="80" cy="340" r="29" fill="#267580"/><text x="80" y="350" text-anchor="middle" fill="white">水</text><rect x="675" y="70" width="100" height="110" rx="12" fill="#dce7ad"/><text x="725" y="55" text-anchor="middle">田边</text><rect x="330" y="205" width="150" height="130" rx="12" fill="#e9d8b8"/><text x="405" y="190" text-anchor="middle">门前</text>';
  let feedback = "";
  if (kind === "canopy")
    feedback = (t.result?.drops || [])
      .map(
        (d) =>
          '<line x1="' +
          d.x +
          '" x2="' +
          d.x +
          '" y1="0" y2="' +
          d.y +
          '" stroke="#69adb7" stroke-width="3" stroke-dasharray="9 24"/><circle cx="' +
          d.x +
          '" cy="' +
          d.y +
          '" r="' +
          (d.stopped ? 5 : 10) +
          '" fill="#6da6ae"/>',
      )
      .join("");
  else {
    const f = flowFrame(t.result);
    feedback =
      '<path d="' +
      f.d +
      '" stroke="#69c7cf" stroke-width="5" fill="none" stroke-linecap="round"/>';
    if (t.result?.blocked && t.result.doorHit)
      feedback +=
        '<circle cx="' +
        t.result.doorHit[0] +
        '" cy="' +
        t.result.doorHit[1] +
        '" r="16" fill="none" stroke="#b95739" stroke-width="4"/>';
    if (t.conditions?.bridge?.tested)
      feedback += '<text x="405" y="325" text-anchor="middle">桥已试过</text>';
  }
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="' +
    (kind === "canopy" ? "这一次画伞试雨的记录" : "这一次画水路试水的记录") +
    '"><rect width="800" height="480" fill="#faf6ec"/><g font-family="Microsoft YaHei,sans-serif" font-size="27" fill="#526753">' +
    guides +
    ink +
    feedback +
    (kind === "river"
      ? '<text x="80" y="350" text-anchor="middle" fill="white">水</text>'
      : "") +
    "</g></svg>"
  );
}
export function trialConditions(t) {
  if (!t.conditions) return "";
  const c = t.conditions;
  return (
    (c.support ? "支架已装稳" : "支架还没装稳") +
    "；" +
    (c.power === "wheel"
      ? "水流推轮"
      : c.power === "people"
        ? "大人轮换提水"
        : "还没选提水办法") +
    "；" +
    (c.bridge?.tested ? "小桥已试走" : "小桥还没试走")
  );
}

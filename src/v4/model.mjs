import {
  COW_SOIL,
  COW_SEED,
  COW_ROCK,
  SEA_ROCK,
  DIRS,
  same,
  includes,
} from "../v3/model.mjs";
import { escapeHtml, albumHtml } from "../v2/engine.mjs";
export const KEY4 = "maliang-qihuan-design-v4";
export const CHAPTERS = {
  cow: {
    title: "田里的好帮手",
    image: "cow-field-v3.png",
    subject: "数学 · 路线与面积",
    art: "画一条耕田路线",
    intro:
      "鲁伯有了耕牛，却还没有想好怎样走。马良把田地画在纸上：“请你来领路。翻开每一块土，也给小苗留一条生路。”",
    needs: [
      "8块田，每块2平方米；小苗和石头不能碰。",
      "耕牛每走一格用1份力气，拐一次弯再用1份。带来的草料能补上14份力气。",
    ],
    change:
      "今天换到河对岸，田的位置排得一样，每块却有3平方米。雨后地面湿软，走一格用2份力气，拐弯另用1份。带来的草料共有22份力气。",
    question: "我估计，这条路线能翻开多少平方米？",
    unit: "平方米",
    hint: "从左下角的“牛”出发，一格一格画。先找8块田，再看看哪里容易走回头路。",
    moral:
      "照顾小苗，也要照顾耕牛。一个好办法，不只做成事，还会减少不必要的折腾。",
  },
  mill: {
    title: "石磨转起来",
    image: "mill-courtyard-v3.png",
    subject: "数学 · 分数与公平",
    art: "画一张分粮图",
    intro:
      "磨坊里磨出了12份面粉。鲁伯家2人，周婶家3人，阿婆家1人。马良问：“三家各拿一样多，就公平了吗？”请把你的分法画给大家看。",
    needs: [
      "12份面粉，6个人，每人应分到2份。",
      "一格是一份。用三种颜色分给三家，全部分完。",
    ],
    change:
      "雨天只磨出9份面粉。每一格现在是半份。阿婆希望先留足2份做软饼。先选一条分粮办法，再看看它对每个人有什么影响。",
    question: "照我的分法，周婶家每人能分到多少份？",
    unit: "份",
    hint: "先选一家，再涂格子。拖着涂、点着涂都可以。同一格只能分给一家，颜色能改。",
    moral:
      "“公平”要先说明按什么分。粮食不够时，把每个人的处境说清楚，比只喊一句“平均分”更有用。",
  },
  sea: {
    title: "借风回家",
    image: "court-sea-v1.png",
    subject: "数学 · 图形与规划",
    art: "画一面能用的船帆",
    intro:
      "大官催着船去金山，船上的人却想回家。马良悄悄铺开画纸：“画一面帆，再安排每一阵风。你的办法，能把大家送到岸边吗？”",
    needs: [
      "帆要连住桅杆上的两个红点，围成一块完整的布。",
      "纸上1小格是一块布：少于3格船不动；3至不足6格走1格；6格及以上走2格。",
    ],
    change:
      "风变大了！每阵风会比昨天多推船1格。把帆收小，可让这一阵风只走1格。礁石中间的一格也不能越过去。",
    question: "我估计，船这次能走过几格水面？",
    unit: "格",
    hint: "按住画帆边，或逐点连线，再点“合上最后一笔”。看看帆的大小，再安排方向。每阵风都能选择是否收小帆。",
    moral:
      "有力量，还要懂得节制。多走一步未必更好；先看清方向，也听听同行的人想去哪里。",
  },
};
export const FAMILIES = ["鲁伯家", "周婶家", "阿婆家"];
export const PALETTE = ["#2b776d", "#b6633c", "#7664a4"];
export const SCENARIOS = ["初试办法", "情况变了"];
export const SOIL = COW_SOIL,
  SEED = COW_SEED,
  ROCK = COW_ROCK;
const copy = (x) => JSON.parse(JSON.stringify(x));
export const freshDesign = () => ({
  route: [[0, 3]],
  allocation: [],
  polygon: [],
  sealed: false,
  commands: [],
  policy: "equal",
  prediction: "",
  claim: "",
  evidence: "",
  next: "",
  peer: "",
  result: null,
  history: [],
});
export const fresh4 = () => ({
  version: 4,
  id: "画卷-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  quiet: false,
  chapters: Object.fromEntries(
    Object.keys(CHAPTERS).map((k) => [
      k,
      {
        phase: "story",
        scenario: 0,
        closed: false,
        designs: [freshDesign(), freshDesign()],
      },
    ]),
  ),
});
export function edit(d, patch) {
  return { ...d, ...patch, result: null };
}
export function routeTrial(d, scenario = 0) {
  let p = [0, 3],
    trace = [p],
    covered = [],
    energy = 0,
    direction = null,
    turns = 0,
    stopped = "",
    budget = scenario ? 22 : 14;
  const route = d.route || [];
  if (!same(route[0] || [-1, -1], p)) stopped = "请从左下角的耕牛这里起笔。";
  for (const n of route.slice(1)) {
    if (stopped) break;
    const v = [n[0] - p[0], n[1] - p[1]],
      dir = Object.keys(DIRS).find((k) => same(DIRS[k], v));
    if (!dir) {
      stopped = "这一步跨过了格子。请沿着相邻格子画，不能斜着走。";
      break;
    }
    if (n[0] < 0 || n[0] > 4 || n[1] < 0 || n[1] > 3) {
      stopped = "到了田外，先停一停。";
      break;
    }
    if (includes(SEED, n) || includes(ROCK, n)) {
      stopped = includes(SEED, n)
        ? "前面是小苗。耕牛停住了，请绕一条路。"
        : "石头挡住了路。试试从旁边走。";
      break;
    }
    const turn = direction !== null && direction !== dir,
      cost = (scenario ? 2 : 1) + (turn ? 1 : 0);
    if (energy + cost > budget) {
      stopped =
        "草料备下的力气不够了。看看能不能少拐一次弯，或少走一段回头路。";
      break;
    }
    energy += cost;
    turns += turn ? 1 : 0;
    direction = dir;
    p = n;
    trace.push(p);
    if (includes(SOIL, p) && !includes(covered, p)) covered.push(p);
  }
  const area = covered.length * (scenario ? 3 : 2),
    ok = covered.length === 8 && !stopped;
  return {
    ok,
    trace,
    covered,
    energy,
    turns,
    budget,
    area,
    actual: area,
    metric: `翻开${covered.length}块田，共${area}平方米；走${trace.length - 1}格，拐${turns}次弯，用${energy}/${budget}份力气。`,
    message:
      stopped ||
      (ok
        ? "8块田都翻好了，小苗也安然无恙。"
        : "还有" +
          (8 - covered.length) +
          "块田没有翻开。看看路线是不是漏了一块。"),
  };
}
export function grainTrial(d, scenario = 0) {
  const length = scenario ? 18 : 12,
    unit = scenario ? 0.5 : 1,
    tiles = Array.from({ length }, (_, i) =>
      [0, 1, 2].includes(d.allocation?.[i]) ? d.allocation[i] : -1,
    ),
    counts = [0, 1, 2].map((k) => tiles.filter((v) => v === k).length * unit),
    blank = tiles.filter((v) => v === -1).length;
  const policy = scenario ? d.policy : "equal",
    targets = scenario ? [3, 4.5, 1.5] : [4, 6, 2];
  const meets =
    policy === "needs"
      ? counts[0] >= 2 && counts[1] >= 3 && counts[2] >= 2
      : counts.every((v, i) => v === targets[i]);
  const ok = blank === 0 && meets;
  const message = blank
    ? `还有${blank * unit}份没有安排。请继续涂好每一格。`
    : ok
      ? policy === "needs"
        ? "三家都留足了约好的份数。多出的部分也有了去处，请把理由讲给大家听。"
        : "按人数分好了，每个人分到的量相同。"
      : policy === "needs"
        ? "看看约好的需要：鲁伯家至少2份，周婶家至少3份，阿婆至少2份。哪家还差一点？"
        : "请按每家的人数再算一算。三家一样多，不等于每个人一样多。";
  return {
    ok,
    counts,
    blank,
    total: scenario ? 9 : 12,
    unit,
    actual: counts[1] / 3,
    policy,
    perPerson: counts.map((n, i) => n / [2, 3, 1][i]),
    metric: counts.map((n, i) => FAMILIES[i] + n + "份").join("，") + "。",
    message,
    consequence: scenario
      ? counts[2] < 2
        ? "阿婆分到的面粉不到2份，还要一起商量怎样补足软饼。"
        : "阿婆的软饼够做了；还要听听另外两家对分法的想法。"
      : "六个人吃饭，人数多的一家需要的粮食也多。",
  };
}
function crosses(a, b, c, d) {
  const cross = (p, q, r) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const on = (p, q, r) =>
    cross(p, q, r) === 0 &&
    r[0] >= Math.min(p[0], q[0]) &&
    r[0] <= Math.max(p[0], q[0]) &&
    r[1] >= Math.min(p[1], q[1]) &&
    r[1] <= Math.max(p[1], q[1]);
  return (
    (cross(a, b, c) * cross(a, b, d) < 0 &&
      cross(c, d, a) * cross(c, d, b) < 0) ||
    on(a, b, c) ||
    on(a, b, d) ||
    on(c, d, a) ||
    on(c, d, b)
  );
}
export function sailShape(points = [], sealed = false) {
  let area = 0,
    error = "";
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    area += a[0] * b[1] - a[1] * b[0];
  }
  area = Math.abs(area) / 2;
  if (!sealed || points.length < 3) error = "先围出船帆，再合上最后一笔。";
  else if (!includes(points, [2, 1]) || !includes(points, [2, 4]))
    error = "船帆还没有连住桅杆上的两个红点。";
  else if (area === 0) error = "这些点排成了一条线，还没有围出一块布。";
  else {
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++) {
        if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
        if (
          crosses(
            points[i],
            points[(i + 1) % points.length],
            points[j],
            points[(j + 1) % points.length],
          )
        )
          error = "帆边交叉或重叠了。挪一挪顶点，让布围成完整的一块。";
      }
  }
  return { area, valid: !error, error, power: area < 3 ? 0 : area < 6 ? 1 : 2 };
}
export function seaTrial4(d, scenario = 0) {
  const shape = sailShape(d.polygon, d.sealed);
  let trace = [[0, 3]],
    p = [0, 3],
    stopped = shape.error,
    events = [];
  if (!stopped && !shape.power)
    stopped = "帆面还不到3格，船暂时动不了。把帆画大一些试试。";
  for (const c of d.commands || []) {
    if (stopped) break;
    const v = DIRS[c.dir];
    if (!v) {
      stopped = "这一阵风还没有方向。";
      break;
    }
    const steps = c.reef ? 1 : shape.power + scenario;
    for (let j = 0; j < steps; j++) {
      const n = [p[0] + v[0], p[1] + v[1]];
      if (n[0] < 0 || n[0] > 4 || n[1] < 0 || n[1] > 3) {
        stopped = "船到了海图边。改一改方向，或把这一阵风的帆收小。";
        break;
      }
      if (includes(SEA_ROCK, n)) {
        stopped = "前面有礁石，船停住了。风再大，也不能跨过礁石。";
        break;
      }
      p = n;
      trace.push(p);
    }
    events.push({ dir: c.dir, reef: c.reef, steps, position: p });
  }
  const home = same(p, [4, 0]),
    gold = same(p, [4, 3]),
    ok = home && !stopped;
  return {
    ok,
    shape,
    trace,
    events,
    position: p,
    actual: trace.length - 1,
    metric: `帆面${shape.area}格；走过${trace.length - 1}格水面，停在第${p[0] + 1}列、第${p[1] + 1}行。`,
    message:
      stopped ||
      (ok
        ? "船靠岸了。提着灯等候的人，终于看见了熟悉的帆。"
        : gold
          ? "到了金山，船上的人却还没回家。听听他们的心愿，再安排一条归路。"
          : "船还在海上。看看岸在哪里，再接着安排。"),
    gold,
  };
}
export function readNumber(text) {
  const a = String(text).trim();
  if (/^\d+(?:\.\d+)?$/.test(a)) return Number(a);
  const m = a.match(/^(\d+)\/(\d+)$/);
  return m && Number(m[2]) !== 0 ? Number(m[1]) / Number(m[2]) : NaN;
}
export function evaluate4(id, d, s = 0) {
  const result =
    id === "cow"
      ? routeTrial(d, s)
      : id === "mill"
        ? grainTrial(d, s)
        : seaTrial4(d, s);
  return {
    ...result,
    prediction: d.prediction,
    forecast:
      d.prediction !== "" && Number.isFinite(readNumber(d.prediction))
        ? Math.abs(readNumber(d.prediction) - result.actual) < 0.001
        : null,
  };
}
export const signature = (d) =>
  JSON.stringify([
    d.route,
    d.allocation,
    d.polygon,
    d.sealed,
    d.commands,
    d.policy,
  ]);
export function run4(id, d, s) {
  const result = evaluate4(id, d, s);
  const snapshot = { ...copy(d), history: undefined, result: undefined };
  return {
    ...d,
    result,
    history: [
      ...d.history,
      { snapshot, result, at: new Date().toISOString() },
    ].slice(-24),
  };
}
const text = (x, n = 600) => (typeof x === "string" ? x.slice(0, n) : "");
export function cleanDesign(raw = {}) {
  const d = freshDesign();
  const point = (p, w, h) =>
    Array.isArray(p) &&
    p.length === 2 &&
    p.every(Number.isInteger) &&
    p[0] >= 0 &&
    p[0] <= w &&
    p[1] >= 0 &&
    p[1] <= h;
  d.route = Array.isArray(raw.route)
    ? raw.route.filter((p) => point(p, 4, 3)).slice(0, 80)
    : d.route;
  d.polygon = Array.isArray(raw.polygon)
    ? raw.polygon.filter((p) => point(p, 8, 5)).slice(0, 30)
    : [];
  d.sealed = raw.sealed === true;
  d.allocation = Array.isArray(raw.allocation)
    ? raw.allocation.slice(0, 18).map((v) => ([0, 1, 2].includes(v) ? v : -1))
    : [];
  d.commands = Array.isArray(raw.commands)
    ? raw.commands
        .filter((c) => c && DIRS[c.dir])
        .slice(0, 40)
        .map((c) => ({ dir: c.dir, reef: c.reef === true }))
    : [];
  d.policy = raw.policy === "needs" ? "needs" : "equal";
  for (const k of ["prediction", "claim", "evidence", "next", "peer"])
    d[k] = text(raw[k], k === "prediction" ? 20 : 600);
  return d;
}
export function restore4(raw) {
  try {
    const n = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (n?.version !== 4) return null;
    const w = fresh4();
    w.id = /^画卷-[A-Z0-9]{1,12}$/.test(n.id) ? n.id : w.id;
    w.quiet = n.quiet === true;
    for (const id of Object.keys(CHAPTERS)) {
      const b = n.chapters?.[id] || {},
        target = w.chapters[id];
      target.scenario = b.scenario === 1 ? 1 : 0;
      target.phase = ["story", "work", "reflect", "ending"].includes(b.phase)
        ? b.phase
        : "story";
      target.closed = b.closed === true;
      target.designs = [0, 1].map((s) => {
        const raw = b.designs?.[s] || {},
          d = cleanDesign(raw);
        d.result = raw.result ? evaluate4(id, d, s) : null;
        d.history = (Array.isArray(raw.history) ? raw.history : [])
          .slice(-24)
          .filter((h) => h?.snapshot)
          .map((h) => {
            const snapshot = cleanDesign(h.snapshot);
            return {
              snapshot,
              result: evaluate4(id, snapshot, s),
              at: text(h.at, 50),
            };
          });
        return d;
      });
      if (!target.designs[0].result?.ok && target.scenario === 1)
        target.scenario = 0;
      if (
        ["reflect", "ending"].includes(target.phase) &&
        !target.designs[target.scenario].result
      ) {
        target.phase = "work";
        target.closed = false;
      }
    }
    return w;
  } catch {
    return null;
  }
}
export function evidence4(id, b) {
  const ds = b.designs,
    attempts = ds.flatMap((d) => d.history),
    passed = ds.filter((d) => d.result?.ok).length;
  const revised = ds.some((d) =>
    d.history.some(
      (a, i) =>
        !a.result.ok &&
        d.history
          .slice(i + 1)
          .some(
            (z) =>
              z.result.ok && signature(z.snapshot) !== signature(a.snapshot),
          ),
    ),
  );
  const forecasts = attempts.filter((x) => x.result.forecast !== null),
    correct = forecasts.filter((x) => x.result.forecast).length;
  return [
    {
      title: "让图画派上用场",
      level: passed ? `已试成${passed}种情况` : "正在试办法",
      evidence: ds
        .map((d, i) =>
          d.result
            ? SCENARIOS[i] + "：" + d.result.metric
            : SCENARIOS[i] + "：还没有试",
        )
        .join(" "),
      next: "把图中的关键一笔指给伙伴看，说说它有什么用。",
    },
    {
      title: "先估计，再核对",
      level: forecasts.length
        ? `${correct}/${forecasts.length}次估计与结果相符`
        : "还没有留下估计",
      evidence: "估计不是抢答。把数量、单位和试做结果放在一起看。",
      next:
        id === "cow"
          ? "注意同一块田走过两遍，面积只算一次。"
          : id === "mill"
            ? "先数人数，再算每家和每人分到的量。"
            : "船走过的格数，要把每阵风和途中停下的位置都算进去。",
    },
    {
      title: "找到原因，再修改",
      level: revised ? "有改过并试成的记录" : "继续积累对照记录",
      evidence: `保存了${attempts.length}次试做。次数不计分；可以一次想好，也可以边试边改。`,
      next: "对照两次图纸，指出改了哪里、结果有什么变化。",
    },
    {
      title: "换个情况也会用",
      level: ds[1].result?.ok ? "新情况已试成" : "新情况还可探索",
      evidence: CHAPTERS[id].change,
      next: "想一想：换了什么条件？原来的办法为什么要改，或为什么仍能用？",
    },
    {
      title: "把想法讲明白",
      level: ds.some((d) => d.claim || d.evidence || d.next)
        ? "已留表达，等待交流"
        : "可以写，也可以指着图讲",
      evidence: "作品的创意、理由是否充分，由老师或伙伴听过讲述再评价。",
      next: "说清我的办法、一次试做的证据，以及它对别人的影响。",
    },
  ];
}
export function report4(w, water) {
  const waterBody = water
    ? albumHtml(water).split("</style>")[1].replace("</html>", "")
    : "";
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>我的神笔研究手册</title><style>body{max-width:960px;margin:30px auto;padding:20px;font:17px/1.8 sans-serif;color:#22483d;background:#faf8ef}section{border-top:2px solid #779889;margin-top:30px}article{border-left:4px solid #d4aa57;padding:5px 18px;margin:18px 0}svg{width:100%;max-width:520px;background:#fff}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #ccc;text-align:left}p{overflow-wrap:anywhere}@media print{button{display:none}section{break-before:page}}</style><h1>我的神笔研究手册</h1><p>${escapeHtml(w.id)} · 作品、试做和新的发现</p><button onclick="window.print()">打印手册</button>${Object.entries(
    CHAPTERS,
  )
    .map(([id, c]) => {
      const b = w.chapters[id];
      return `<section><h2>${c.title}</h2><p>${b.closed ? "本章已收好" : "这一章还可继续"} · ${c.moral}</p>${evidence4(
        id,
        b,
      )
        .map(
          (e) =>
            `<article><h3>${e.title} · ${e.level}</h3><p>${escapeHtml(e.evidence)}</p><p>下一步：${escapeHtml(e.next)}</p></article>`,
        )
        .join(
          "",
        )}${b.designs.map((d, s) => `<h3>${SCENARIOS[s]}</h3><p>${s ? c.change : c.needs.join(" ")}</p>${drawingSvg(id, d, s)}<p>我的安排：${escapeHtml(planText(id, d))}</p><p>${escapeHtml(d.result?.message || "还没有试做。")}</p><p>我的办法：${escapeHtml(d.claim || "还未记录")}</p><p>我的证据：${escapeHtml(d.evidence || "还未记录")}</p><p>我还想到：${escapeHtml(d.next || "还未记录")}</p><p>交流评价：${escapeHtml(d.peer || "等待交流")}</p><table><tr><th>试做</th><th>估计与结果</th><th>图纸</th></tr>${d.history.map((h, i) => `<tr><td>第${i + 1}次 · ${h.result.ok ? "试成" : "继续改"}</td><td>估计${escapeHtml(h.snapshot.prediction || "未填写")}；${escapeHtml(h.result.metric)}</td><td>${drawingSvg(id, h.snapshot, s)}<p>${escapeHtml(planText(id, h.snapshot))}</p></td></tr>`).join("")}</table>`).join("")}</section>`;
    })
    .join(
      "",
    )}${waterBody ? "<section><h2>一笔清泉 · 水路学习记录</h2>" + waterBody + "</section>" : ""}</html>`;
}
export function planText(id, d) {
  if (id === "sea")
    return (
      d.commands
        .map(
          (c, i) =>
            `${i + 1}. ${{ N: "向上", E: "向右", S: "向下", W: "向左" }[c.dir]}·${c.reef ? "收小帆" : "展开帆"}`,
        )
        .join("；") || "还没安排风"
    );
  if (id === "cow")
    return d.route.map((p) => `第${p[0] + 1}列第${p[1] + 1}行`).join(" → ");
  return d.policy === "needs"
    ? "按约定先顾眼前需要，再安排余下的面粉"
    : "按人数分，每个人一样多";
}
export function drawingSvg(id, d, s) {
  const frame = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" role="img" aria-label="我的设计图">${body}</svg>`;
  if (id === "cow")
    return frame(
      Array.from({ length: 20 }, (_, i) => {
        const p = [i % 5, Math.floor(i / 5)],
          x = 40 + p[0] * 80,
          y = 20 + p[1] * 65;
        return `<rect x="${x}" y="${y}" width="72" height="57" fill="${includes(SOIL, p) ? "#c6a169" : includes(SEED, p) ? "#78a87c" : includes(ROCK, p) ? "#999" : "#eee8ce"}"/>`;
      }).join("") +
        `<polyline points="${d.route.map((p) => [76 + p[0] * 80, 48 + p[1] * 65].join(",")).join(" ")}" stroke="#17685b" stroke-width="7" fill="none"/>`,
    );
  if (id === "mill")
    return frame(
      Array.from(
        { length: s ? 18 : 12 },
        (_, i) =>
          `<rect x="${25 + (i % 6) * 73}" y="${35 + Math.floor(i / 6) * 75}" width="64" height="65" rx="8" fill="${PALETTE[d.allocation[i]] || "#e5ddc4"}"/><text x="${57 + (i % 6) * 73}" y="${74 + Math.floor(i / 6) * 75}" text-anchor="middle" fill="${d.allocation[i] >= 0 ? "white" : "#444"}" font-size="18">${d.allocation[i] >= 0 ? ["鲁", "周", "婆"][d.allocation[i]] : "空"}</text>`,
      ).join(""),
    );
  return frame(
    `<path d="M120 240V60" stroke="#9b613b" stroke-width="7"/><${d.sealed ? "polygon" : "polyline"} points="${d.polygon.map((p) => [p[0] * 50 + 20, p[1] * 50 + 20].join(",")).join(" ")}" stroke="#347b70" stroke-width="4" fill="${d.sealed ? "#e5c67b" : "none"}"/>`,
  );
}

// Reduce a pointer trail before snapping to the drawing grid; retain real corners.
export function simplifyInk(points, tolerance = 0.22) {
  if (points.length < 3) return points.map((p) => p.map(Math.round));
  const dist = (p, a, b) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = dx * dx + dy * dy,
      t = len
        ? Math.max(
            0,
            Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len),
          )
        : 0;
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const reduce = (xs) => {
    if (xs.length < 3) return xs;
    let max = 0,
      index = 0;
    for (let i = 1; i < xs.length - 1; i++) {
      const v = dist(xs[i], xs[0], xs.at(-1));
      if (v > max) {
        max = v;
        index = i;
      }
    }
    return max > tolerance
      ? [
          ...reduce(xs.slice(0, index + 1)).slice(0, -1),
          ...reduce(xs.slice(index)),
        ]
      : [xs[0], xs.at(-1)];
  };
  return reduce(points.slice(0, 500))
    .map((p) => p.map(Math.round))
    .filter((p, i, a) => !i || !same(p, a[i - 1]));
}

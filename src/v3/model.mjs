import {
  validStrokes,
  strokesSvg,
  escapeHtml,
  ending,
  ENDINGS,
} from "../v2/engine.mjs";
export const WORLD_KEY = "maliang-qihuan-world-v3";
export const STORIES = [
  {
    id: "water",
    title: "一笔清泉",
    tag: "画水路 · 拼小桥 · 教伙伴",
    image: "river-survey-v1.png",
    subject: "观察与探究",
    line: "把水引到田里，把办法留给大家。",
    time: "约25—35分钟",
  },
  {
    id: "cow",
    title: "田里的好帮手",
    tag: "画耕牛 · 排路线 · 算田地",
    image: "cow-field-v3.png",
    subject: "方向与面积",
    line: "牛来了，怎样耕完田，又不碰伤小苗？",
    time: "约12—18分钟",
  },
  {
    id: "mill",
    title: "石磨转起来",
    tag: "画粮袋 · 转石磨 · 分粮食",
    image: "mill-courtyard-v3.png",
    subject: "数量与分配",
    line: "三家人口不同，这一袋面粉怎么分？",
    time: "约12—18分钟",
  },
  {
    id: "sea",
    title: "借风回家",
    tag: "画船帆 · 调风向 · 找归路",
    image: "court-sea-v1.png",
    subject: "计划与选择",
    line: "远处是金山，身后是等人回家的灯火。",
    time: "约12—18分钟",
  },
];
export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const DIR_NAMES = { N: "向上", E: "向右", S: "向下", W: "向左" };
export const COW_SOIL = [
  [1, 0],
  [2, 0],
  [3, 0],
  [1, 1],
  [3, 1],
  [1, 2],
  [2, 2],
  [3, 2],
];
export const COW_SEED = [
    [0, 1],
    [0, 2],
  ],
  COW_ROCK = [[2, 1]];
export const SEA_ROCK = [
    [1, 3],
    [2, 2],
    [3, 1],
  ],
  SEA_START = [0, 3],
  SEA_HOME = [4, 0],
  SEA_GOLD = [4, 3];
export const same = (a, b) => a[0] === b[0] && a[1] === b[1];
export const includes = (list, p) => list.some((q) => same(p, q));
export const blankBranch = () => ({
  phase: "intro",
  strokes: [],
  route: [],
  quarters: 0,
  bags: [0, 0, 0],
  wind: "N",
  strength: 1,
  sail: [],
  destination: "home",
  result: null,
  history: [],
  note: "",
  self: "",
  purpose: "",
  area: "",
  closed: false,
});
export function freshWorld() {
  return {
    version: 3,
    id: "画卷-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    created: new Date().toISOString(),
    quiet: false,
    teacher: "",
    observations: {},
    branches: { cow: blankBranch(), mill: blankBranch(), sea: blankBranch() },
  };
}
export function cowTrial(route) {
  let p = [0, 3],
    trace = [p],
    ploughed = [],
    blocked = "";
  for (const d of route) {
    const v = DIRS[d];
    if (!v) {
      blocked = "路线里有一张认不出的方向牌。";
      break;
    }
    const n = [p[0] + v[0], p[1] + v[1]];
    if (n[0] < 0 || n[0] > 4 || n[1] < 0 || n[1] > 3) {
      blocked = "前面到了田外，耕牛停下了。换一个方向吧。";
      break;
    }
    if (includes(COW_SEED, n)) {
      blocked = "前面是小苗，耕牛停住了。给小苗绕一条路吧。";
      break;
    }
    if (includes(COW_ROCK, n)) {
      blocked = "前面有大石头，耕牛停下了。试着从旁边绕过去。";
      break;
    }
    p = n;
    trace.push(p);
    if (includes(COW_SOIL, p) && !includes(ploughed, p)) ploughed.push(p);
  }
  const ok = !blocked && ploughed.length === COW_SOIL.length;
  return {
    ok,
    trace,
    ploughed,
    area: ploughed.length * 2,
    message:
      blocked ||
      (ok
        ? "8小块田都耕好了，小苗也好好的！"
        : "耕好了" +
          ploughed.length +
          "小块田，还有" +
          (8 - ploughed.length) +
          "小块等着你。"),
  };
}
export function millTrial(quarters, bags) {
  const made = quarters * 3,
    total = bags.reduce((a, b) => a + b, 0),
    people = [2, 3, 1],
    target = [4, 6, 2];
  const ok = quarters === 4 && bags.every((n, i) => n === target[i]);
  return {
    ok,
    made,
    total,
    bags: [...bags],
    people,
    remaining: made - total,
    message:
      quarters < 4
        ? "石磨还没转满一圈。每转四分之一圈，能磨出3份面粉。"
        : total < 12
          ? "还有" + (12 - total) + "份留在粮袋里。想一想，哪家还需要？"
          : ok
            ? "三家每人都有2份，12份面粉正好分完！"
            : "面粉分完了。再按每家的人数数一数，是不是每人都有2份？",
  };
}
export function seaTrial(sail, destination = "home") {
  let p = [...SEA_START],
    trace = [p],
    blocked = "";
  for (const m of sail) {
    const d = DIRS[m.dir];
    if (!d || ![1, 2].includes(m.strength)) {
      blocked = "先选好方向和风力，再出发。";
      break;
    }
    for (let i = 0; i < m.strength; i++) {
      const n = [p[0] + d[0], p[1] + d[1]];
      if (n[0] < 0 || n[0] > 4 || n[1] < 0 || n[1] > 3) {
        blocked = "船到了画纸边，先收帆，再换个方向。";
        break;
      }
      if (includes(SEA_ROCK, n)) {
        blocked = "前面有礁石，船停在了礁石旁。绕开它再走吧。";
        break;
      }
      p = n;
      trace.push(p);
    }
    if (blocked) break;
  }
  const home = same(p, SEA_HOME),
    gold = same(p, SEA_GOLD),
    ok = home;
  return {
    ok,
    home,
    gold,
    trace,
    position: p,
    blocked,
    destination,
    message:
      blocked ||
      (home
        ? "船靠岸了！岸上的人提着灯来接大家。"
        : gold
          ? "金山到了，船上的人却还没回家。换一条回家的路吧。"
          : "船停在第" +
            (p[0] + 1) +
            "列、第" +
            (p[1] + 1) +
            "行。看看岸在哪里，再调一阵风。"),
  };
}
export function evaluate(id, b) {
  return id === "cow"
    ? cowTrial(b.route)
    : id === "mill"
      ? millTrial(b.quarters, b.bags)
      : seaTrial(b.sail, b.destination);
}
const copy = (x) => JSON.parse(JSON.stringify(x));
export function trial(id, b) {
  if (!b.strokes.length)
    return {
      ...b,
      result: { ok: false, message: "先画出你的办法，再让它走进故事。" },
    };
  const result = evaluate(id, b);
  return {
    ...b,
    result,
    closed: false,
    history: [
      ...b.history,
      {
        strokes: copy(b.strokes),
        route: [...b.route],
        quarters: b.quarters,
        bags: [...b.bags],
        sail: copy(b.sail),
        destination: b.destination,
        result,
      },
    ].slice(-12),
  };
}
export function revise(b, patch) {
  return { ...b, ...patch, result: null, closed: false };
}
export function allot(b, i, delta) {
  if (!Number.isInteger(i) || i < 0 || i > 2 || ![1, -1].includes(delta))
    return b;
  const bags = [...b.bags];
  if (
    bags[i] + delta < 0 ||
    bags.reduce((a, v) => a + v, 0) + delta > b.quarters * 3
  )
    return b;
  bags[i] += delta;
  return revise(b, { bags });
}
const cleanText = (x, max = 400) =>
  typeof x === "string" ? x.slice(0, max) : "";
function cleanTask(raw) {
  const b = blankBranch();
  if (!raw || typeof raw !== "object") return b;
  b.strokes = validStrokes(raw.strokes) ? raw.strokes : [];
  b.route = Array.isArray(raw.route)
    ? raw.route.filter((x) => DIRS[x]).slice(0, 40)
    : [];
  b.quarters =
    Number.isInteger(raw.quarters) && raw.quarters >= 0 && raw.quarters <= 4
      ? raw.quarters
      : 0;
  if (
    Array.isArray(raw.bags) &&
    raw.bags.length === 3 &&
    raw.bags.every((x) => Number.isInteger(x) && x >= 0 && x <= 12) &&
    raw.bags.reduce((a, v) => a + v, 0) <= b.quarters * 3
  )
    b.bags = raw.bags;
  b.sail = Array.isArray(raw.sail)
    ? raw.sail
        .filter((m) => m && DIRS[m.dir] && [1, 2].includes(m.strength))
        .slice(0, 30)
        .map((m) => ({ dir: m.dir, strength: m.strength }))
    : [];
  b.wind = DIRS[raw.wind] ? raw.wind : "N";
  b.strength = [1, 2].includes(raw.strength) ? raw.strength : 1;
  b.destination = raw.destination === "gold" ? "gold" : "home";
  for (const k of ["note", "purpose"]) b[k] = cleanText(raw[k]);
  b.self = ["能讲清楚", "还想试试", "想请伙伴帮忙"].includes(raw.self)
    ? raw.self
    : "";
  b.area = ["8", "16", "18"].includes(raw.area) ? raw.area : "";
  return b;
}
export function restoreWorld(raw) {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (v?.version !== 3) return null;
    const w = freshWorld();
    w.id = /^画卷-[A-Z0-9]{6}$/.test(v.id) ? v.id : w.id;
    w.created =
      typeof v.created === "string" && !isNaN(Date.parse(v.created))
        ? v.created
        : w.created;
    w.quiet = v.quiet === true;
    w.teacher = cleanText(v.teacher, 800);
    w.observations = {};
    for (const id of ["language", "art", "math", "inquiry", "care"])
      if (["prompt", "evidence", "transfer"].includes(v.observations?.[id]))
        w.observations[id] = v.observations[id];
    for (const id of ["cow", "mill", "sea"]) {
      const r = v.branches?.[id],
        b = cleanTask(r);
      b.history = Array.isArray(r?.history)
        ? r.history
            .slice(-12)
            .filter((t) => validStrokes(t?.strokes) && t.strokes.length)
            .map((t) => {
              const h = cleanTask(t);
              return { ...h, result: evaluate(id, h) };
            })
        : [];
      b.result = r?.result && b.strokes.length ? evaluate(id, b) : null;
      b.phase = ["intro", "draw", "play", "ending"].includes(r?.phase)
        ? r.phase
        : "intro";
      if (!b.strokes.length && ["play", "ending"].includes(b.phase))
        b.phase = "draw";
      b.closed = r?.closed === true && !!b.result;
      b.history = b.history.map(
        ({ strokes, route, quarters, bags, sail, destination, result }) => ({
          strokes,
          route,
          quarters,
          bags,
          sail,
          destination,
          result,
        }),
      );
      w.branches[id] = b;
    }
    return w;
  } catch {
    return null;
  }
}
export function chapterRecord(id, w, water) {
  if (id === "water") {
    const closed = !!water?.endings?.length;
    return {
      closed,
      ok: closed && ["E1", "E2"].includes(ending(water)),
      message: closed ? ENDINGS[ending(water)][0] : "故事还在等你添一笔",
      note: water?.note || "",
    };
  }
  const b = w.branches[id];
  return {
    closed: b.closed,
    ok: !!b.result?.ok,
    message: b.result?.message || "还没有试过",
    note: b.note,
  };
}
export function indicators(w, water) {
  const bs = Object.values(w.branches),
    works =
      bs.filter((b) => b.strokes.length).length +
      (water?.canopy.strokes.length ? 1 : 0) +
      (water?.river.strokes.length ? 1 : 0),
    notes =
      bs.filter((b) => b.note.trim()).length + (water?.note.trim() ? 1 : 0);
  const cow = w.branches.cow,
    mill = w.branches.mill,
    sea = w.branches.sea;
  const math = [];
  if (cow.result?.ok && cow.area === "16")
    math.push("田里：数出8块，每块2平方米，共16平方米");
  if (mill.result?.ok) math.push("石磨：按2人、3人、1人分成4份、6份、2份");
  if (sea.result?.home) math.push("海上：按方向和格数把船送到岸边");
  const improved = Object.entries(w.branches).filter(
    ([, b]) => b.result?.ok && b.history.some((t) => !t.result.ok),
  );
  const waterImproved =
    water?.river.result?.ok && water.river.tests.some((t) => !t.result.ok);
  const tested =
    bs.some((b) => b.history.length) ||
    !!water?.river.tests.length ||
    !!water?.canopy.tests.length;
  const care = [];
  if (water?.handoff.done)
    care.push("照着留下的做法，完成了查看、提水、停水、收工具");
  if (cow.result?.ok) care.push("耕完田，也绕开了小苗");
  if (sea.result?.home) care.push("把船送到归岸处");
  return [
    {
      id: "language",
      title: "把事情说清楚",
      subject: "语文表达",
      status: notes ? "已有文字，等交流" : "等你来讲",
      evidence: notes
        ? "留下了" +
          notes +
          "段自己的话。请指着作品，讲清先做什么、看见什么、又改了什么。"
        : "可以写，也可以指着画说给伙伴听。口头交流由老师记录。",
      next: "挑一次试做，用“我先……发现……所以……”讲一讲。",
      limit: "文字是否清楚、有依据，由师生一起听、一起看。",
    },
    {
      id: "art",
      title: "画出自己的办法",
      subject: "美术创意",
      status: works ? "已有作品，等交流" : "等你来画",
      evidence: works
        ? "留下了" + works + "幅亲手画的作品。画稿已收进下面的画册。"
        : "画一头牛、一只粮袋或一面帆，让它走进故事。",
      next: "指一处自己用心画的地方，说说它有什么用。",
      limit: "不按像不像、笔画多少和颜色多少评定创意。",
    },
    {
      id: "math",
      title: "数一数，算一算",
      subject: "数学应用",
      status: math.length ? "本次任务已有证据" : "再留一条证据",
      evidence: math.join("；") || "可以去田里算面积，或在磨坊按人数分面粉。",
      next: mill.result?.ok
        ? "试着算一算：每人改为3份，共要多少份？"
        : "每家需要的份数＝人数×每人2份。",
      limit: "只说明这次具体任务，不代表整门学科的水平。",
    },
    {
      id: "inquiry",
      title: "试过以后再改一改",
      subject: "探究改进",
      status:
        improved.length || waterImproved
          ? "留下了改进证据"
          : tested
            ? "已经试过"
            : "等你来试",
      evidence:
        improved.length || waterImproved
          ? "在" +
            [
              ...(waterImproved ? ["一笔清泉"] : []),
              ...improved.map(([id]) => STORIES.find((s) => s.id === id).title),
            ].join("、") +
            "中，先前未成功的办法经过修改后成功了。"
          : tested
            ? "有实际试做记录。第一次就成功，也可以说说为什么这样安排。"
            : "先让画里的办法试一次，看看哪里有变化。",
      next: "比较前后两次记录，说出改了哪里、结果怎样。",
      limit: "不按用时或重试次数扣分，也不要求先失败。",
    },
    {
      id: "care",
      title: "把别人的需要放在心上",
      subject: "合作与责任",
      status: care.length ? "本次任务已有证据" : "等你留下行动",
      evidence:
        care.join("；") || "听听村里人需要什么，再想自己的画能帮上什么。",
      next: water?.handoff.done
        ? "请现实中的伙伴照着你的说明做一次，再听听他的建议。"
        : "去《一笔清泉》，把做法教给接手的人。",
      limit: "记录具体行动，不给学生贴性格或品德标签。",
    },
  ];
}
export function reportHtml(w, water) {
  const esc = escapeHtml,
    rows = indicators(w, water);
  return (
    '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>我的成长画卷</title><style>body{max-width:900px;margin:auto;padding:24px;background:#fbf7ee;color:#173e43;font:17px/1.8 sans-serif}h1,h2{font-family:KaiTi,serif}article{border-top:1px solid #b8c8bc;padding:20px 0}svg{width:100%;max-height:260px;border:1px solid #ced6c7}p{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#526764}section{break-inside:avoid}summary{cursor:pointer}table{width:100%;border-collapse:collapse}td,th{padding:10px;border:1px solid #ccc}@media print{details>*{display:block}article{break-inside:avoid}}</style><h1>我的成长画卷</h1><p>神笔马良：奇幻一笔 · ' +
    esc(w.id) +
    "</p><p>这份报告收好了我画过的画、试过的办法和想说的话。记录保存在这台设备中。</p>" +
    STORIES.map((s) => {
      const r = chapterRecord(s.id, w, water);
      return (
        "<p><b>" +
        s.title +
        "</b> · " +
        (r.closed ? "已收好这一章" : "故事还在继续") +
        " · " +
        esc(r.message) +
        "</p>"
      );
    }).join("") +
    "<h2>我留下的学习证据</h2>" +
    rows
      .map(
        (r) =>
          "<article><h3>" +
          r.subject +
          " · " +
          r.title +
          "</h3><b>" +
          r.status +
          "</b><p>" +
          esc(r.evidence) +
          "</p><p>下一步：" +
          esc(r.next) +
          "</p><small>" +
          esc(r.limit) +
          "</small><p>师生交流记录：" +
          esc(
            {
              prompt: "借助提示，试着说明",
              evidence: "能结合这次的证据说明",
              transfer: "能在新的任务中运用",
            }[w.observations?.[r.id]] || "还没一起交流",
          ) +
          "</p></article>",
      )
      .join("") +
    "<h2>作品和试做记录</h2>" +
    ["cow", "mill", "sea"]
      .map((id) => {
        const b = w.branches[id],
          title = STORIES.find((s) => s.id === id).title;
        return (
          "<article><h3>" +
          title +
          "</h3>" +
          strokesSvg(b.strokes) +
          "<p>这幅画的用处：" +
          esc(b.purpose || "还想当面讲一讲") +
          "</p><p>" +
          esc(b.result?.message || "还没有试过") +
          "</p><p>我想说：" +
          esc(b.note || "还没有写下") +
          "</p><p>我自己看：" +
          esc(b.self || "还没有选择") +
          "</p><details open><summary>试做记录（保留最近12次）</summary>" +
          b.history
            .map(
              (t, i) =>
                "<section><p>记录" +
                (i + 1) +
                "：" +
                esc(t.result.message) +
                "</p><p>" +
                esc(
                  id === "cow"
                    ? "路线：" + t.route.map((d) => DIR_NAMES[d]).join("、")
                    : id === "mill"
                      ? "转了" +
                        t.quarters +
                        "个四分之一圈；分粮：" +
                        t.bags.join("、") +
                        "份"
                      : "风向：" +
                        t.sail
                          .map((m) => DIR_NAMES[m.dir] + m.strength + "格")
                          .join("、"),
                ) +
                "</p>" +
                strokesSvg(t.strokes) +
                "</section>",
            )
            .join("") +
          "</details></article>"
        );
      })
      .join("") +
    (water
      ? "<article><h3>一笔清泉</h3>" +
        strokesSvg(water.canopy.strokes) +
        strokesSvg(water.river.strokes) +
        "<p>" +
        esc(water.river.result?.message || "水路还没试过") +
        "</p><p>" +
        esc(water.note) +
        "</p><p>交接：" +
        (water.handoff.done ? "已完成" : "还没有完成") +
        "</p><details open><summary>水路试做记录</summary>" +
        water.river.tests
          .map(
            (t, i) =>
              "<p>记录" +
              (i + 1) +
              "：" +
              esc(t.result.message) +
              "</p>" +
              strokesSvg(t.strokes),
          )
          .join("") +
        "</details></article>"
      : "") +
    "<h2>老师或伙伴的话</h2><p>" +
    esc(w.teacher || "可以打印后写在这里。") +
    '</p><h2>评价怎样得来</h2><p>参照义务教育课程标准（2022年版）的表达交流、美术实践、数学应用、探究与合作方向，制定本项目任务指标。程序只核对可观察的任务结果；表达质量、艺术创意及现实中的合作表现需要师生交流。没有总分和排名。</p><p>课程标准：<a href="https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html">教育部发布页</a>。完整指标与学段建议见随包教师指南。</p></html>'
  );
}

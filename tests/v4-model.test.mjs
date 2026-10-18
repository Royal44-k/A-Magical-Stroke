import test from "node:test";
import assert from "node:assert/strict";
import {
  fresh4,
  freshDesign,
  routeTrial,
  grainTrial,
  sailShape,
  seaTrial4,
  run4,
  edit,
  restore4,
  evidence4,
  report4,
} from "../src/v4/model.mjs";
const route = [
  [0, 3],
  [1, 3],
  [1, 2],
  [2, 2],
  [3, 2],
  [3, 1],
  [3, 0],
  [2, 0],
  [1, 0],
  [1, 1],
];
const sail = () => ({
  ...freshDesign(),
  polygon: [
    [2, 4],
    [2, 1],
    [6, 4],
  ],
  sealed: true,
  commands: [
    { dir: "N", reef: false },
    { dir: "N", reef: true },
    { dir: "E", reef: false },
    { dir: "E", reef: false },
  ],
});
test("同一条最短路线在晴天和雨天的面积、力气分别核算", () => {
  const d = { ...freshDesign(), route };
  const a = routeTrial(d, 0),
    b = routeTrial(d, 1);
  assert.equal(a.ok, true);
  assert.equal(a.area, 16);
  assert.equal(a.energy, 14);
  assert.equal(b.ok, false);
});
test("不能跨格、斜走、伤苗或越过石头", () => {
  for (const end of [
    [2, 3],
    [1, 2],
    [0, 2],
  ])
    assert.equal(
      routeTrial({ ...freshDesign(), route: [[0, 3], end] }).ok,
      false,
    );
  assert.match(
    routeTrial({
      ...freshDesign(),
      route: [
        [0, 3],
        [0, 2],
      ],
    }).message,
    /小苗/,
  );
});
test("重复经过田地不重复计算面积", () => {
  const r = routeTrial({
    ...freshDesign(),
    route: [
      [0, 3],
      [1, 3],
      [1, 2],
      [1, 3],
      [1, 2],
    ],
  });
  assert.equal(r.area, 2);
});
test("一笔和空路线都不能通关", () => {
  assert.equal(routeTrial(freshDesign()).ok, false);
  assert.equal(routeTrial({ ...freshDesign(), route: [] }).ok, false);
});
test("分粮颜色和位置可以不同，按人数兑现同一约定", () => {
  const a = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2];
  assert.equal(grainTrial({ ...freshDesign(), allocation: a }).ok, true);
  assert.equal(
    grainTrial({ ...freshDesign(), allocation: a.toReversed() }).ok,
    true,
  );
  assert.equal(
    grainTrial({
      ...freshDesign(),
      allocation: [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2],
    }).ok,
    false,
  );
});
test("缺粮时半份计算，平均到人的结果有独立反馈", () => {
  const a = [...Array(6).fill(0), ...Array(9).fill(1), ...Array(3).fill(2)];
  const r = grainTrial({ ...freshDesign(), allocation: a }, 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.counts, [3, 4.5, 1.5]);
  assert.match(r.consequence, /不到2份/);
});
test("先顾需要存在多解，不能把人格当判定", () => {
  for (const counts of [
    [6, 8, 4],
    [4, 10, 4],
    [4, 6, 8],
  ]) {
    const allocation = counts.flatMap((n, i) => Array(n).fill(i));
    assert.equal(
      grainTrial({ ...freshDesign(), allocation, policy: "needs" }, 1).ok,
      true,
    );
  }
  assert.equal(
    grainTrial(
      { ...freshDesign(), allocation: Array(18).fill(2), policy: "needs" },
      1,
    ).ok,
    false,
  );
});
test("空格和额外数组不会凭空复制面粉", () => {
  assert.equal(grainTrial({ ...freshDesign(), allocation: [] }, 1).blank, 18);
  assert.equal(
    grainTrial({ ...freshDesign(), allocation: Array(30).fill(0) }, 1)
      .counts[0],
    9,
  );
});
test("帆形面积、封口、红点、交叉、重复边逐一检查", () => {
  const p = [
    [2, 4],
    [2, 1],
    [6, 4],
  ];
  assert.equal(sailShape(p, true).area, 6);
  assert.equal(sailShape(p, true).valid, true);
  assert.equal(sailShape(p, false).valid, false);
  assert.equal(
    sailShape(
      [
        [0, 0],
        [0, 3],
        [3, 0],
      ],
      true,
    ).valid,
    false,
  );
  assert.equal(
    sailShape(
      [
        [2, 4],
        [6, 1],
        [2, 1],
        [6, 4],
      ],
      true,
    ).valid,
    false,
  );
  assert.equal(
    sailShape(
      [
        [2, 4],
        [2, 1],
        [6, 4],
        [2, 1],
      ],
      true,
    ).valid,
    false,
  );
});
test("不同有效帆形均能产生作用", () => {
  assert.equal(
    sailShape(
      [
        [2, 4],
        [2, 1],
        [6, 1],
        [6, 4],
      ],
      true,
    ).power,
    2,
  );
  assert.equal(
    sailShape(
      [
        [2, 4],
        [2, 1],
        [4, 4],
      ],
      true,
    ).power,
    1,
  );
});
test("大帆归航，每个中间格必须安全", () => {
  assert.equal(seaTrial4(sail()).ok, true);
  assert.equal(seaTrial4(sail()).actual, 7);
  const d = sail();
  d.commands = [{ dir: "E", reef: false }];
  assert.match(seaTrial4(d).message, /礁石/);
  assert.equal(seaTrial4(d).actual, 0);
});
test("大风改变步长，收帆修正并能归航", () => {
  const d = sail();
  assert.equal(seaTrial4(d, 1).ok, false);
  d.commands = [
    { dir: "N", reef: false },
    { dir: "E", reef: false },
    { dir: "E", reef: true },
  ];
  assert.equal(seaTrial4(d, 1).ok, true);
});
test("小帆不能用收帆开关凭空驱动", () => {
  const d = sail();
  d.polygon = [
    [2, 4],
    [2, 1],
    [3, 4],
  ];
  d.commands = d.commands.map((c) => ({ ...c, reef: true }));
  assert.equal(seaTrial4(d).actual, 0);
});
test("预测与图纸快照不可事后修改，改图撤销当前结果", () => {
  const d = run4("sea", { ...sail(), prediction: "7" }, 0);
  const edited = edit(d, { prediction: "0", polygon: [] });
  assert.equal(edited.result, null);
  assert.equal(edited.history[0].snapshot.prediction, "7");
  assert.equal(edited.history[0].result.forecast, true);
});
test("恢复不信任伪造通关和伪造历史，保留原图重新核对", () => {
  const w = fresh4();
  w.chapters.cow.designs[0].result = { ok: true };
  w.chapters.cow.designs[0].history = [
    { snapshot: freshDesign(), result: { ok: true } },
  ];
  const r = restore4(w);
  assert.equal(r.chapters.cow.designs[0].result.ok, false);
  assert.equal(r.chapters.cow.designs[0].history[0].result.ok, false);
});
test("新画卷不把旧版成果判为本轮通过", () => {
  assert.equal(restore4({ version: 3 }), null);
  assert.equal(evidence4("cow", fresh4().chapters.cow)[0].level, "正在试办法");
});
test("报告转义文字并保留全部试做图，未测不能宣称掌握", () => {
  const w = fresh4();
  w.chapters.sea.designs[0] = run4(
    "sea",
    { ...sail(), claim: "<img src=x onerror=alert(1)>" },
    0,
  );
  const html = report4(w);
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("还没有试"));
  assert.ok(html.includes("polygon"));
});
test("雨天存在更少拐弯的有效路线，晴天多种走法都有效", () => {
  const path = [
    [0, 3],
    [1, 3],
    [1, 2],
    [1, 1],
    [1, 0],
    [2, 0],
    [3, 0],
    [3, 1],
    [3, 2],
    [2, 2],
  ];
  const d = { ...freshDesign(), route: path };
  assert.equal(routeTrial(d).ok, true);
  const r = routeTrial(d, 1);
  assert.equal(r.ok, true);
  assert.equal(r.energy, 22);
  assert.equal(r.area, 24);
});
test("分数预测可用于每人份数，不能把分母为零当有效估计", () => {
  const d = {
    ...freshDesign(),
    policy: "needs",
    allocation: [...Array(6).fill(0), ...Array(8).fill(1), ...Array(4).fill(2)],
    prediction: "4/3",
  };
  assert.equal(run4("mill", d, 1).result.forecast, true);
  assert.equal(
    run4("mill", { ...d, prediction: "6/0" }, 1).result.forecast,
    null,
  );
});
import { simplifyInk } from "../src/v4/model.mjs";
test("连续描画保留直线拐角，不制造格点折返尾巴", () => {
  const points = [];
  for (let i = 0; i <= 20; i++) points.push([2, 4 - (3 * i) / 20]);
  for (let i = 1; i <= 20; i++)
    points.push([2 + (4 * i) / 20, 1 + (3 * i) / 20]);
  assert.deepEqual(simplifyInk(points), [
    [2, 4],
    [2, 1],
    [6, 4],
  ]);
});

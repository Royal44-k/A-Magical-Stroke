import test from "node:test";
import assert from "node:assert/strict";
import {
  freshWorld,
  blankBranch,
  cowTrial,
  millTrial,
  seaTrial,
  trial,
  revise,
  allot,
  restoreWorld,
  indicators,
  reportHtml,
  chapterRecord,
} from "../src/v3/model.mjs";
import { fresh } from "../src/v2/engine.mjs";
const ink = [
    {
      color: "#215d69",
      width: 9,
      points: [
        [200, 200],
        [600, 300],
      ],
    },
  ],
  route = ["E", "N", "E", "E", "N", "N", "W", "W", "S"];
const branch = () => ({ ...blankBranch(), strokes: ink });
test("田地：合法路线覆盖8块田共16平方米", () => {
  const r = cowTrial(route);
  assert.equal(r.ok, true);
  assert.equal(r.area, 16);
  assert.equal(r.trace.length, 10);
});
test("田地：经过同一块田不重复累计面积", () => {
  const r = cowTrial(["E", "N", "S", "N"]);
  assert.equal(r.ploughed.length, 1);
  assert.equal(r.area, 2);
});
test("田地：小苗和石头都会停下耕牛", () => {
  const a = cowTrial(["N"]),
    b = cowTrial(["E", "N", "E", "N"]);
  assert.match(a.message, /小苗/);
  assert.match(b.message, /石头/);
  assert.deepEqual(a.trace, [[0, 3]]);
  assert.equal(b.ok, false);
});
test("田地：超出边界停止，不产生虚构耕田", () => {
  assert.match(cowTrial(["W"]).message, /田外/);
});
test("石磨：四个四分之一圈生成12份；4、6、2份满足每人2份", () => {
  assert.equal(millTrial(4, [4, 6, 2]).ok, true);
  assert.equal(millTrial(4, [4, 4, 4]).ok, false);
  assert.equal(millTrial(3, [4, 3, 2]).ok, false);
});
test("分粮不能凭空加份，也不能取回负数", () => {
  let b = branch();
  assert.equal(allot(b, 0, 1), b);
  b.quarters = 1;
  for (let i = 0; i < 4; i++) b = allot(b, 0, 1);
  assert.deepEqual(b.bags, [3, 0, 0]);
  assert.equal(allot(b, 1, -1), b);
  assert.equal(allot(b, 4, 1), b);
});
test("分粮取回后可以再分，已完成结果失效", () => {
  let b = {
    ...branch(),
    quarters: 4,
    bags: [4, 6, 2],
    closed: true,
    result: { ok: true },
  };
  b = allot(b, 0, -1);
  assert.equal(b.result, null);
  assert.equal(b.closed, false);
  b = allot(b, 0, 1);
  assert.equal(millTrial(b.quarters, b.bags).ok, true);
});
test("海图：两格的风检查中途礁石，不能跳过去", () => {
  const r = seaTrial([{ dir: "E", strength: 2 }]);
  assert.equal(r.ok, false);
  assert.match(r.message, /礁石/);
  assert.deepEqual(r.position, [0, 3]);
});
test("海图：绕开礁石可归岸，路线每一步都保留", () => {
  const r = seaTrial([
    { dir: "N", strength: 2 },
    { dir: "N", strength: 1 },
    { dir: "E", strength: 2 },
    { dir: "E", strength: 2 },
  ]);
  assert.equal(r.home, true);
  assert.equal(r.trace.length, 8);
});
test("海图：到金山不会伪报归岸", () => {
  const r = seaTrial(
    [
      { dir: "N", strength: 1 },
      { dir: "E", strength: 1 },
      { dir: "N", strength: 2 },
      { dir: "E", strength: 2 },
      { dir: "E", strength: 1 },
      { dir: "S", strength: 2 },
      { dir: "S", strength: 1 },
    ],
    "gold",
  );
  assert.equal(r.gold, true);
  assert.equal(r.ok, false);
  assert.match(r.message, /还没回家/);
});
test("学生尚未作画时不能生成成功试次", () => {
  const b = trial("cow", { ...blankBranch(), route });
  assert.equal(b.history.length, 0);
  assert.equal(b.result.ok, false);
});
test("画稿、计划与结果按当时状态保留，后改不篡改历史", () => {
  let b = trial("cow", { ...branch(), route });
  const old = JSON.stringify(b.history);
  b = revise(b, { route: ["N"], strokes: [] });
  assert.equal(JSON.stringify(b.history), old);
  assert.equal(b.result, null);
});
test("每支线最多保留12次试做，结束标志不等同成功", () => {
  let b = branch();
  for (let i = 0; i < 15; i++) b = trial("cow", b);
  assert.equal(b.history.length, 12);
  const w = freshWorld();
  w.branches.cow = { ...b, phase: "ending", closed: true };
  const r = chapterRecord("cow", w, fresh());
  assert.equal(r.closed, true);
  assert.equal(r.ok, false);
});
test("刷新恢复实际数据并重新核算当前和历史结果", () => {
  const w = freshWorld();
  w.branches.cow = {
    ...trial("cow", { ...branch(), route: ["N"] }),
    closed: true,
    phase: "ending",
  };
  w.branches.cow.result.ok = true;
  w.branches.cow.history[0].result.ok = true;
  const r = restoreWorld(JSON.stringify(w));
  assert.equal(r.branches.cow.result.ok, false);
  assert.equal(r.branches.cow.history[0].result.ok, false);
});
test("损坏存档不执行HTML，不接纳越界画点或超量分粮", () => {
  const w = freshWorld();
  w.branches.mill = {
    ...branch(),
    quarters: 1,
    bags: [12, 12, 12],
    phase: "play",
  };
  w.branches.cow.strokes = [
    { color: "red", width: 9, points: [[Infinity, 0]] },
  ];
  const r = restoreWorld(w);
  assert.deepEqual(r.branches.mill.bags, [0, 0, 0]);
  assert.deepEqual(r.branches.cow.strokes, []);
  assert.equal(restoreWorld("{bad"), null);
});
test("无记录报告明确待探索，不虚构五项达成", () => {
  const rows = indicators(freshWorld(), fresh());
  assert.equal(rows.length, 5);
  assert.equal(
    rows.some((r) => r.status === "本次任务已有证据"),
    false,
  );
});
test("数学反馈需要可核对的计算结果，单纯有画不等于学科达成", () => {
  const w = freshWorld();
  w.branches.cow = trial("cow", { ...branch(), route });
  assert.equal(indicators(w, fresh())[2].status, "再留一条证据");
  w.branches.cow.area = "16";
  assert.equal(indicators(w, fresh())[2].status, "本次任务已有证据");
});
test("表达与创意保持人工交流，不按文字长度或笔画打分", () => {
  const w = freshWorld();
  w.branches.cow = { ...branch(), note: "hello" };
  const r = indicators(w, fresh());
  assert.equal(r[0].status, "已有文字，等交流");
  assert.equal(r[1].status, "已有作品，等交流");
});
test("改进反馈来自先前问题与当前成功，首次成功不贬低", () => {
  const w = freshWorld();
  let b = trial("cow", { ...branch(), route: ["N"] });
  b = trial("cow", revise(b, { route }));
  w.branches.cow = b;
  assert.equal(indicators(w, fresh())[3].status, "留下了改进证据");
  w.branches.cow = trial("cow", { ...branch(), route });
  assert.equal(indicators(w, fresh())[3].status, "已经试过");
});
test("离线报告包含实际画稿、逐次计划、评价边界并转义自填文字", () => {
  const w = freshWorld();
  w.branches.cow = {
    ...trial("cow", { ...branch(), route }),
    note: "<script>alert(1)</script>",
  };
  const html = reportHtml(w, fresh());
  assert.match(html, /<polyline/);
  assert.match(html, /路线：向右/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /没有总分和排名/);
});

test("师生交流评价随存档恢复并进入离线报告", () => {
  const w = freshWorld();
  w.observations.language = "evidence";
  const r = restoreWorld(w);
  assert.equal(r.observations.language, "evidence");
  assert.match(reportHtml(r, fresh()), /能结合这次的证据说明/);
});

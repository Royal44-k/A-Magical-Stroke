import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fresh4, KEY4, run4 } from "../src/v4/model.mjs";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({
  viewport: { width: 1440, height: 960 },
  acceptDownloads: true,
});
const errors = [],
  checks = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const state = () =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY4);
const start = async (id) => {
  await p.goto("http://127.0.0.1:4185/?edition=4.0&story=" + id);
  await p.getByRole("button", { name: "铺开我的图纸" }).click();
};
try {
  await start("cow");
  const grid = await p.locator(".q4-grid").boundingBox();
  const at = ([x, y]) => ({
    x: grid.x + ((x + 0.5) * grid.width) / 5,
    y: grid.y + ((y + 0.5) * grid.height) / 4,
  });
  let q = at([0, 3]);
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  for (const v of [
    [1, 3],
    [1, 2],
    [1, 1],
    [1, 0],
    [2, 0],
    [3, 0],
    [3, 1],
    [3, 2],
    [2, 2],
  ]) {
    q = at(v);
    await p.mouse.move(q.x, q.y, { steps: 8 });
  }
  await p.mouse.up();
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  assert.equal((await state()).chapters.cow.designs[0].result.ok, true);
  checks.push("鼠标连续拖画路线可形成有效方案，不依赖点选");
  await p.getByLabel("查看执行到第几步").fill("2");
  await p.waitForTimeout(750);
  assert.equal(await p.getByLabel("查看执行到第几步").inputValue(), "2");
  await p.getByRole("button", { name: "走进立体场景" }).click();
  await p.locator(".sp-world canvas").waitFor();
  const before = JSON.stringify((await state()).chapters.cow.designs[0]);
  await p.getByRole("button", { name: "从上面看", exact: true }).click();
  assert.equal(JSON.stringify((await state()).chapters.cow.designs[0]), before);
  await p.screenshot({ path: "artifacts/v5.0/legacy/cow-spatial-final.jpg" });
  await p
    .locator(".sp-world canvas")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  assert.ok(
    await p.getByText("已换成平面图，画、试和记录都能继续。").isVisible(),
  );
  assert.equal(JSON.stringify((await state()).chapters.cow.designs[0]), before);
  assert.equal(await p.locator(".sp-flat .q4-field").count(), 1);
  checks.push("回放可暂停定位，切镜头和WebGL失效不改答案");
  await start("mill");
  const grain = await p.locator(".q4-grid").boundingBox();
  await p.mouse.move(grain.x + grain.width / 12, grain.y + grain.height / 4);
  await p.mouse.down();
  await p.mouse.move(
    grain.x + (grain.width * 5.5) / 6,
    grain.y + grain.height / 4,
    { steps: 40 },
  );
  await p.mouse.up();
  assert.deepEqual(
    (await state()).chapters.mill.designs[0].allocation.slice(0, 6),
    Array(6).fill(0),
  );
  checks.push("分粮支持连续涂色，每格归属唯一");
  await start("sea");
  const paper = p.locator(".q4-sail-paper");
  const pt = async (x, y) =>
    paper.evaluate(
      (el, [x, y]) => {
        const p = el.createSVGPoint();
        p.x = x * 70 + 40;
        p.y = y * 70 + 35;
        const q = p.matrixTransform(el.getScreenCTM());
        return { x: q.x, y: q.y };
      },
      [x, y],
    );
  q = await pt(2, 4);
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  for (const v of [
    [2, 1],
    [6, 4],
  ]) {
    q = await pt(...v);
    await p.mouse.move(q.x, q.y, { steps: 20 });
  }
  await p.mouse.up();
  await p.getByRole("button", { name: "合上最后一笔", exact: true }).click();
  const drawn = (await state()).chapters.sea.designs[0];
  assert.ok(drawn.polygon.length >= 3);
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  assert.equal(
    (await state()).chapters.sea.designs[0].result.shape.valid,
    true,
  );
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  await paper.scrollIntoViewIfNeeded();
  const last = drawn.polygon.at(-1);
  q = await pt(...last);
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  q = await pt(7, 4);
  await p.mouse.move(q.x, q.y, { steps: 5 });
  await p.mouse.up();
  const edited = (await state()).chapters.sea.designs[0];
  assert.equal(edited.result, null);
  assert.deepEqual(edited.polygon.at(-1), [7, 4]);
  assert.deepEqual(edited.history[0].snapshot.polygon, drawn.polygon);
  checks.push("连续描帆、拖顶点改变面积；历史图纸不被覆盖");
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  await p.locator(".q4-sail-paper").scrollIntoViewIfNeeded();
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  assert.ok(
    await p.locator(".q4-sail-paper").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return el.contains(
        document.elementFromPoint(r.x + r.width * 0.6, r.y + r.height * 0.4),
      );
    }),
  );
  checks.push("减少动态与窄屏画纸可用，小禾不挡住画纸中心");
  await p.getByRole("button", { name: "研究手册", exact: true }).click();
  const dl = p.waitForEvent("download");
  await p.getByRole("button", { name: "带走我的手册" }).click();
  const dest = "artifacts/v5.0/legacy/complete-report.html";
  await (await dl).saveAs(dest);
  const html = fs.readFileSync(dest, "utf8");
  assert.ok(html.includes("一笔清泉 · 水路学习记录"));
  assert.ok(html.includes("我的安排"));
  await p.getByRole("button", { name: "打印手册", exact: true }).click();
  assert.ok(await p.locator('iframe[title="研究手册打印"]').count());
  checks.push("导出和打印均含四章实际作品、水路与航行安排");
  await p.setViewportSize({ width: 1440, height: 960 });
  await p.getByRole("button", { name: "教师", exact: true }).click();
  assert.equal(
    (
      await p.request.get("http://127.0.0.1:4185/teacher-guide-v4.html")
    ).status(),
    200,
  );
  await p.getByRole("button", { name: "为下一位同学另开画卷" }).click();
  assert.ok(await p.locator("dialog").isVisible());
  await p.getByRole("button", { name: "继续这张画卷" }).click();
  assert.ok((await state()).chapters.sea.designs[0].history.length > 0);
  checks.push("完整教师指南可读，新画卷取消不丢作品");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "artifacts/v5.0/legacy/detail-validation.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ checks }, null, 2));
} catch (e) {
  await p.screenshot({
    path: "artifacts/v5.0/legacy/detail-failure.jpg",
    fullPage: true,
  });
  console.error(errors);
  console.log(JSON.stringify(await state()));
  throw e;
} finally {
  await b.close();
}

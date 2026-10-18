import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import { KEY4 } from "../src/v4/model.mjs";
const base = process.env.MALIANG_TEST_URL || "http://127.0.0.1:4185";
const output = "artifacts/v5.0/legacy";
fs.mkdirSync(output, { recursive: true });
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
const go = async (id) => {
  await p.goto(base + "/?edition=4.0&release=4.0&story=" + id);
  await p.locator(".q4").waitFor();
  if (await p.getByRole("button", { name: "铺开我的图纸" }).count())
    await p.getByRole("button", { name: "铺开我的图纸" }).click();
};
const state = () =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY4);
const check = async (id, s, ok) =>
  assert.equal((await state()).chapters[id].designs[s].result?.ok, ok);
const draw = async (path, keyboard = false) => {
  for (const [x, y] of path) {
    const cell = p.locator(".q4-field:not(.replay) .q4-cell").nth(y * 5 + x);
    if (keyboard) {
      await cell.focus();
      await p.keyboard.press("Enter");
    } else await cell.click();
  }
};
try {
  await p.goto(base + "/?edition=4.0");
  await p.locator(".sp-world canvas").waitFor();
  assert.equal(await p.locator(".w3-story-book").count(), 4);
  await p.screenshot({ path: output + "/map.jpg" });
  checks.push("四章地图及本地WebGL正常");
  await go("cow");
  assert.equal(
    await p.getByRole("button", { name: "情况变了", exact: true }).isDisabled(),
    true,
  );
  await draw([[0, 2]]);
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("cow", 0, false);
  assert.match(await p.locator(".q4-feedback").innerText(), /小苗/);
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  await p.getByRole("button", { name: "从起点重画" }).click();
  const path = [
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
  await draw(path, true);
  await p.getByLabel("试做前的估计").fill("16");
  await p.screenshot({ path: output + "/cow-plan.jpg" });
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("cow", 0, true);
  assert.equal((await state()).chapters.cow.designs[0].result.forecast, true);
  checks.push("键盘画路线、遇苗停下、修改成功、预测保存");
  await p.getByRole("button", { name: "走进立体场景" }).click();
  await p.locator(".sp-world canvas").waitFor();
  await p.screenshot({ path: output + "/cow-spatial.jpg" });
  await p.getByRole("button", { name: "回到路线图" }).click();
  await p.getByRole("button", { name: "挑战：情况变了" }).click();
  await p.getByLabel("试做前的估计").fill("24");
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("cow", 1, false);
  assert.match(await p.locator(".q4-feedback").innerText(), /力气不够/);
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  await p.getByRole("button", { name: "从起点重画" }).click();
  await draw([
    [1, 3],
    [1, 2],
    [1, 1],
    [1, 0],
    [2, 0],
    [3, 0],
    [3, 1],
    [3, 2],
    [2, 2],
  ]);
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("cow", 1, true);
  assert.equal((await state()).chapters.cow.designs[1].result.energy, 22);
  checks.push("新条件原路失败，少拐弯方案22份力气通过");
  await p.getByRole("button", { name: "把发现讲清楚" }).click();
  await p.locator("textarea").nth(0).fill("我少拐了一次弯，雨天也能耕完。");
  await p.getByLabel("选择要讲述的试做").selectOption("1");
  await p
    .locator("textarea")
    .nth(2)
    .fill("把小苗、石头和每块田的位置讲给鲁伯。");
  await p.getByRole("button", { name: "带着发现，看看结尾" }).click();
  assert.equal(await p.getByText("本章结束", { exact: true }).count(), 1);
  await p.screenshot({ path: output + "/cow-ending.jpg", fullPage: true });
  await p.reload();
  await p.locator('.q4').waitFor();
  assert.equal(await p.getByText("本章结束", { exact: true }).count(), 1);
  checks.push("结局有结束标记、人物变化、真实结果、表达与刷新恢复");
  await go("mill");
  const paint = async (family, indices, keyboard = false) => {
    await p.locator(".q4-palette button").nth(family).click();
    for (const i of indices) {
      const c = p.locator(".q4-grain").nth(i);
      if (keyboard) {
        await c.focus();
        await p.keyboard.press("Enter");
      } else await c.click();
    }
  };
  await paint(0, [0, 1, 2, 3]);
  await paint(1, [4, 5, 6, 7]);
  await paint(2, [8, 9, 10, 11]);
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("mill", 0, false);
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  await paint(1, [8, 9], true);
  await p.getByLabel("试做前的估计").fill("2");
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("mill", 0, true);
  checks.push("每家一样的4/4/4不冒充按人数公平，涂色纠正4/6/2");
  await p.getByRole("button", { name: "挑战：情况变了" }).click();
  await paint(0, [0, 1, 2, 3, 4, 5]);
  await paint(1, [6, 7, 8, 9, 10, 11, 12, 13, 14]);
  await paint(2, [15, 16, 17]);
  await p.getByLabel("试做前的估计").fill("1.5");
  await p.screenshot({ path: output + "/mill-plan.jpg" });
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("mill", 1, true);
  assert.match(await p.locator(".q4-feedback").innerText(), /不到2份/);
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  await p.getByLabel(/先顾眼前需要/).check();
  await paint(2, [14]);
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("mill", 1, true);
  assert.deepEqual(
    (await state()).chapters.mill.designs[1].result.counts,
    [3, 4, 2],
  );
  checks.push("缺粮用半份，平均与按需要两种有效方案有不同后果");
  await go("sea");
  const paper = p.locator(".q4-sail-paper");
  await paper.focus();
  await p.keyboard.press("Enter");
  for (let i = 0; i < 3; i++) await p.keyboard.press("ArrowUp");
  await p.keyboard.press("Enter");
  for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowRight");
  for (let i = 0; i < 3; i++) await p.keyboard.press("ArrowDown");
  await p.keyboard.press("Enter");
  await p.getByRole("button", { name: "合上最后一笔", exact: true }).click();
  assert.match(await p.locator(".q4-note").first().innerText(), /6格布/);
  await p.getByRole("button", { name: "↑ 向上", exact: true }).click();
  await p.getByLabel("下一阵风收小帆").check();
  await p.getByRole("button", { name: "↑ 向上", exact: true }).click();
  await p.getByLabel("下一阵风收小帆").uncheck();
  await p.getByRole("button", { name: "→ 向右", exact: true }).click();
  await p.getByRole("button", { name: "→ 向右", exact: true }).click();
  await p.getByLabel("试做前的估计").fill("7");
  await p.screenshot({ path: output + "/sea-plan.jpg" });
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("sea", 0, true);
  checks.push("键盘构造6格船帆，其面积实际决定步长和归航");
  await p.getByRole("button", { name: "挑战：情况变了" }).click();
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("sea", 1, false);
  await p.getByRole("button", { name: "回到图纸，接着改" }).click();
  for (let i = 0; i < 4; i++)
    await p.getByRole("button", { name: "撤回最后一阵风" }).click();
  await p.getByRole("button", { name: "↑ 向上", exact: true }).click();
  await p.getByRole("button", { name: "→ 向右", exact: true }).click();
  await p.getByLabel("下一阵风收小帆").check();
  await p.getByRole("button", { name: "→ 向右", exact: true }).click();
  await p.getByRole("button", { name: "让神笔试一试" }).click();
  await check("sea", 1, true);
  checks.push("大风原方案失败，收帆后的新方案归航成功");
  await p.getByRole("button", { name: "研究手册", exact: true }).click();
  assert.equal(await p.locator(".q4-evidence-list article").count(), 15);
  const dl = p.waitForEvent("download");
  await p.getByRole("button", { name: "带走我的手册" }).click();
  const dest = output + "/student-report.html";
  await (await dl).saveAs(dest);
  const html = fs.readFileSync(dest, "utf8");
  assert.ok(html.includes("少拐了一次弯"));
  assert.ok(html.includes("预测") || html.includes("估计"));
  await p.screenshot({ path: output + "/report.jpg", fullPage: true });
  const off = await b.newContext({ offline: true });
  const op = await off.newPage();
  await op.goto("file:///" + process.cwd().replaceAll("\\", "/") + "/" + dest);
  assert.ok((await op.locator("svg").count()) > 10);
  await off.close();
  checks.push("专属报告有15条证据反馈、图纸快照和原样预测，离线可读");
  for (const id of ["cow", "mill", "sea"]) {
    await go(id);
    if (
      await p.getByRole("button", { name: "回去改一改", exact: true }).count()
    )
      await p.getByRole("button", { name: "回去改一改", exact: true }).click();
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
    await p.screenshot({
      path: output + "/" + id + "-mobile.jpg",
      fullPage: true,
    });
    await p.setViewportSize({ width: 1440, height: 960 });
  }
  checks.push("390px三章布局无横向溢出");
  await p.goto(base + "/?edition=3.1");
  await p.locator(".w3-story-book").first().waitFor();
  assert.ok((await p.locator(".w3-story-book").count()) === 4);
  await p.goto(base + "/?edition=4.0&story=water");
  await p.locator(".v2").waitFor();
  assert.ok(await p.locator(".v2").count());
  checks.push("原成长画卷与水路主线仍可打开");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    output + "/browser-validation.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} catch (e) {
  await p.screenshot({ path: output + "/browser-failure.jpg", fullPage: true });
  console.error(errors);
  throw e;
} finally {
  await b.close();
}

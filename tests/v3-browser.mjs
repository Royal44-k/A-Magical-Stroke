import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { WORLD_KEY } from "../src/v3/model.mjs";
const out = "artifacts/v4.0/legacy",
  url = process.env.TEST_BASE_URL || "http://127.0.0.1:4185",
  browser = await chromium.launch({ channel: "msedge", headless: true }),
  checks = [],
  errors = [];
fs.mkdirSync(out, { recursive: true });
const click = (p, name) => p.getByRole("button", { name, exact: true }).click(),
  read = (p) =>
    p.evaluate((k) => JSON.parse(localStorage.getItem(k)), WORLD_KEY),
  shot = async (p, n) => {
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: out + "/" + n + ".png", fullPage: true });
  };
async function paint(p) {
  const el = p.locator(".w3-paper");
  await el.scrollIntoViewIfNeeded();
  const r = await el.boundingBox();
  await p.mouse.move(r.x + r.width * 0.2, r.y + r.height * 0.6);
  await p.mouse.down();
  await p.mouse.move(r.x + r.width * 0.45, r.y + r.height * 0.2, { steps: 8 });
  await p.mouse.move(r.x + r.width * 0.75, r.y + r.height * 0.55, { steps: 8 });
  await p.mouse.up();
}
async function enter(p, id) {
  await p.goto(url + "/?edition=3.1&release=4.0&story=" + id);
  await click(
    p,
    { cow: "画一头耕牛", mill: "画一只粮袋", sea: "画一面船帆" }[id],
  );
  await paint(p);
  await click(p, "画好了，让它走进故事");
}
try {
  const c = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      acceptDownloads: true,
      reducedMotion: "reduce",
    }),
    p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url + "/?edition=3.1&release=4.0");
  await shot(p, "01-map");
  assert.equal(await p.locator(".w3-story-book").count(), 4);
  assert.ok(
    await p
      .locator(".w3-story-book img")
      .evaluateAll((xs) => xs.every((x) => x.complete && x.naturalWidth > 0)),
  );
  checks.push("四章入口及全部场景图可见，独立进入且不锁顺序");
  await enter(p, "cow");
  await click(p, "加入向上");
  await click(p, "请耕牛走一走");
  assert.match((await read(p)).branches.cow.result.message, /小苗/);
  await click(p, "先收好这一次");
  assert.ok(
    await p.getByRole("heading", { name: "这个问题，已经记下了" }).isVisible(),
  );
  await click(p, "回去改一改");
  await click(p, "重新排路");
  for (const d of [
    "向右",
    "向上",
    "向右",
    "向右",
    "向上",
    "向上",
    "向左",
    "向左",
    "向下",
  ])
    await click(p, "加入" + d);
  await click(p, "请耕牛走一走");
  await click(p, "8平方米");
  assert.ok(
    await p.getByText("一块是2平方米，把8个2加起来再想想。").isVisible(),
  );
  await click(p, "16平方米");
  assert.equal((await read(p)).branches.cow.result.ok, true);
  await shot(p, "02-cow-game");
  await click(p, "看看这一章的结尾");
  await p
    .locator(".w3-own-words textarea")
    .fill("我先走到了小苗前，后来绕到田中间，8小块田都耕好了。");
  await click(p, "能讲清楚");
  await shot(p, "03-cow-ending");
  await click(p, "看看我的学习反馈");
  assert.ok(await p.getByText("留下了改进证据", { exact: true }).isVisible());
  await p.reload();
  assert.equal((await read(p)).branches.cow.closed, true);
  checks.push(
    "真实鼠标绘画、田地碰苗分支、改路成功、面积纠错、章末反思及刷新持久化",
  );
  await enter(p, "mill");
  for (let i = 0; i < 4; i++) await click(p, "顺时针转四分之一圈");
  assert.equal((await read(p)).branches.mill.quarters, 4);
  await p
    .getByRole("button", { name: "拿起1份面粉", exact: true })
    .dragTo(
      p.getByRole("button", { name: "把1份面粉放到鲁伯家", exact: true }),
    );
  for (let i = 0; i < 3; i++) {
    await click(p, "拿起1份面粉");
    await click(p, "把1份面粉放到鲁伯家");
  }
  for (const n of ["周婶家", "阿婆家"])
    for (let i = 0; i < 4; i++) {
      await click(p, "拿起1份面粉");
      await click(p, "把1份面粉放到" + n);
    }
  await click(p, "请三家数一数");
  assert.equal((await read(p)).branches.mill.result.ok, false);
  const granny = p.locator(".w3-families section").nth(2);
  for (let i = 0; i < 2; i++) {
    await granny.getByRole("button", { name: "取回1份", exact: true }).click();
    await click(p, "拿起1份面粉");
    await click(p, "把1份面粉放到周婶家");
  }
  await click(p, "请三家数一数");
  assert.deepEqual((await read(p)).branches.mill.bags, [4, 6, 2]);
  assert.equal((await read(p)).branches.mill.result.ok, true);
  await shot(p, "04-mill-game");
  await click(p, "看看这一章的结尾");
  await click(p, "还想试试");
  checks.push(
    "石磨转四分之一圈、拖放与点选分粮、平均分袋误区、取回重分后正确结果",
  );
  await enter(p, "sea");
  await click(p, "风吹向右");
  await click(p, "大一点 · 2格");
  await click(p, "加上这阵风");
  await click(p, "扬帆，试试这条路");
  assert.match((await read(p)).branches.sea.result.message, /礁石/);
  assert.deepEqual((await read(p)).branches.sea.result.position, [0, 3]);
  await click(p, "重新排风向");
  for (const [d, n] of [
    ["向上", 2],
    ["向上", 1],
    ["向右", 2],
    ["向右", 2],
  ]) {
    await click(p, "风吹" + d);
    await click(p, n === 1 ? "轻风 · 1格" : "大一点 · 2格");
    await click(p, "加上这阵风");
  }
  await click(p, "扬帆，试试这条路");
  assert.equal((await read(p)).branches.sea.result.home, true);
  await shot(p, "05-sea-game");
  await click(p, "看看这一章的结尾");
  await shot(p, "06-sea-ending");
  checks.push(
    "海上两格风逐格查礁石、改变风向后归岸、实际帆画出现在航行中与章末",
  );
  await click(p, "看看我的学习反馈");
  await p.locator(".w3-observation summary").first().click();
  await p.getByLabel("语文表达交流评价").selectOption("evidence");
  await p
    .getByLabel("老师或伙伴的话")
    .fill("能结合碰苗和绕路的记录讲清自己的修改。");
  await shot(p, "07-report");
  const download = p.waitForEvent("download");
  await click(p, "带走我的报告");
  const d = await download,
    dest = out + "/student-report.html";
  await d.saveAs(dest);
  const html = fs.readFileSync(dest, "utf8");
  assert.match(html, /向右、向上/);
  assert.match(html, /能结合这次的证据说明/);
  assert.match(html, /能结合碰苗/);
  const offline = await browser.newContext({
      offline: true,
      viewport: { width: 390, height: 844 },
    }),
    op = await offline.newPage();
  await op.goto(pathToFileURL(process.cwd() + "/" + dest).href);
  assert.ok((await op.locator("svg polyline").count()) > 0);
  assert.equal(
    await op.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await offline.close();
  checks.push(
    "个人报告保留三章真实作品、逐次计划与结果、师生评价；下载后完全离线可读",
  );
  await p.setViewportSize({ width: 390, height: 844 });
  for (const page of ["", "cow", "mill", "sea", "report"]) {
    await p.goto(url + "/?edition=3.1&story=" + page);
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "overflow " + page,
    );
  }
  await shot(p, "08-mobile-report");
  await p.goto(url + "/?edition=3.1&story=mill");
  await p.getByRole("button", { name: "3 试办法", exact: true }).click();
  await shot(p, "09-mobile-mill");
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  checks.push("390px四章和报告无横向溢出，竖排分粮操作可见");
  await p.goto(url+"/?edition=3.1");
  const before = (await read(p)).id;
  await click(p, "另开一张画卷");
  await click(p, "还要接着画");
  assert.equal((await read(p)).id, before);
  await click(p, "另开一张画卷");
  await click(p, "收好了，打开新画卷");
  assert.notEqual((await read(p)).id, before);
  assert.equal((await read(p)).branches.cow.strokes.length, 0);
  await click(p, "我的成长画卷");
  assert.ok(
    await p
      .getByText("画卷刚刚展开。等你画过、试过，发现就会留在这里。")
      .isVisible(),
  );
  checks.push(
    "新画卷先提示带走报告，可取消；确认后生成新的无姓名编号及空白评价",
  );
  const k = await c.newPage();
  k.on("pageerror", (e) => errors.push(e.message));
  await k.goto(url + "/?edition=3.1&story=sea");
  await click(k, "画一面船帆");
  await k.locator(".w3-paper").focus();
  await k.keyboard.press("Enter");
  await k.keyboard.press("ArrowRight");
  await k.keyboard.press("ArrowRight");
  await k.keyboard.press("Enter");
  await k.keyboard.press("Escape");
  assert.equal((await read(k)).branches.sea.strokes[0].points.length, 2);
  await click(k, "画好了，让它走进故事");
  assert.ok(
    await k.getByRole("heading", { name: "让风把船送到哪里？" }).isVisible(),
  );
  checks.push("仅键盘也能留下真实画稿并进入故事");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + "/v3-browser-results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(checks.join("\n"));
  await c.close();
} finally {
  await browser.close();
}

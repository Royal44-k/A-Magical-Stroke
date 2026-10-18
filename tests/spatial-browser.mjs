import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
import * as T from "three";
import { WORLD_KEY, freshWorld, blankBranch } from "../src/v3/model.mjs";
import { KEY, fresh, draw, testDrawing } from "../src/v2/engine.mjs";
const out = "artifacts/v5.0/legacy",
  url = process.env.TEST_BASE_URL || "http://127.0.0.1:4185",
  checks = [],
  errors = [];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ink = [
  {
    color: "#215d69",
    width: 14,
    points: [
      [100, 350],
      [220, 150],
      [450, 150],
      [650, 350],
      [100, 350],
    ],
  },
];
const world = freshWorld();
for (const id of ["cow", "mill", "sea"])
  world.branches[id] = { ...blankBranch(), phase: "play", strokes: ink };
const c = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  reducedMotion: "reduce",
  acceptDownloads: true,
});
const p = await c.newPage();
p.on("pageerror", (e) => errors.push(e.message));
const click = (name) => p.getByRole("button", { name, exact: true }).click(),
  read = () =>
    p.evaluate((k) => JSON.parse(localStorage.getItem(k)), WORLD_KEY);
async function ready() {
  await p.locator('.sp-world[data-renderer="webgl"]').waitFor();
  await p.waitForFunction(
    () => Number(document.querySelector(".sp-world")?.dataset.frames) >= 1,
  );
}
async function project(pos, kind) {
  const r = await p.locator(".sp-world").boundingBox(),
    a = r.width / r.height,
    d = kind === "mill" ? 0.9 : kind === "map" ? 1.55 : 1,
    fit = Math.max(1, 1.2 / a),
    camera = new T.PerspectiveCamera(37, a, 0.1, 180);
  camera.position.set(0, 16 * d * fit, 0.01 * fit);
  camera.lookAt(0, 0.2, 0);
  camera.updateMatrixWorld();
  const q = new T.Vector3(...pos).project(camera);
  return {
    x: r.x + ((q.x + 1) * r.width) / 2,
    y: r.y + ((1 - q.y) * r.height) / 2,
  };
}
async function tap(pos, kind) {
  const q = await project(pos, kind);
  await p.mouse.click(q.x, q.y);
  await p.evaluate(() => new Promise(requestAnimationFrame));
}
try {
  await p.goto(url + "/?edition=3.1&release=4.0");
  await ready();
  assert.equal(await p.locator(".w3-story-book").count(), 4);
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.screenshot({ path: out + "/spatial-map.png" });
  await click("全屏探索");
  assert.ok(await p.evaluate(() => !!document.fullscreenElement));
  await click("退出全屏");
  assert.equal(await p.evaluate(() => !!document.fullscreenElement), false);
  checks.push("村庄真实WebGL、四章入口、全屏进入与退出");
  await p.evaluate(({ k, w }) => localStorage.setItem(k, JSON.stringify(w)), {
    k: WORLD_KEY,
    w: world,
  });
  await p.goto(url + "/?edition=3.1&story=cow");
  await ready();
  await click("从上面看");
  await tap([-1.5, 0.04, 2.25], "cow");
  assert.deepEqual((await read()).branches.cow.route, ["E"]);
  await tap([3, 0.04, -2.25], "cow");
  assert.deepEqual((await read()).branches.cow.route, ["E"]);
  assert.match(await p.locator(".sp-stage-caption").textContent(), /紧挨着/);
  const before = (await read()).branches.cow;
  await click("转动场景");
  const r = await p.locator(".sp-world").boundingBox();
  await p.mouse.move(r.x + r.width * 0.6, r.y + r.height * 0.45);
  await p.mouse.down();
  await p.mouse.move(r.x + r.width * 0.8, r.y + r.height * 0.58, { steps: 12 });
  await p.mouse.up();
  assert.deepEqual((await read()).branches.cow, before);
  await click("回到动手操作");
  await click("恢复观察角度");
  await p.screenshot({ path: out + "/spatial-cow.png" });
  checks.push("射线点选田块真正排路，远格不误加；拖镜头不篡改计划");
  const f = Number(await p.locator(".sp-world").getAttribute("data-frames"));
  await p.waitForTimeout(500);
  assert.equal(
    Number(await p.locator(".sp-world").getAttribute("data-frames")),
    f,
  );
  await click("看平面图");
  assert.ok(await p.locator(".w3-game-grid").isVisible());
  assert.deepEqual((await read()).branches.cow, before);
  await click("回到立体场景");
  await ready();
  checks.push("减少动态停止连续绘制；平面/立体共用同一学生记录");
  await p.goto(url + "/?edition=3.1&story=mill");
  await ready();
  await click("从上面看");
  const q = await project([1.2, 1.25, 0], "mill");
  await p.mouse.move(q.x, q.y);
  await p.mouse.down();
  for (let i = 1; i <= 18; i++) {
    const v = await project(
      [
        -0.6 + 1.8 * Math.cos((i / 18) * Math.PI * 0.55),
        1.25,
        1.8 * Math.sin((i / 18) * Math.PI * 0.55),
      ],
      "mill",
    );
    await p.mouse.move(v.x, v.y);
  }
  await p.mouse.up();
  assert.equal((await read()).branches.mill.quarters, 1);
  await tap([1.55, 0.26, 0.6], "mill");
  assert.equal(
    await p
      .getByRole("button", { name: "拿起1份面粉", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await tap([-2.3, 0.5, 2.25], "mill");
  assert.equal((await read()).branches.mill.bags[0], 1);
  await tap([-2.3, 0.5, 2.25], "mill");
  assert.equal((await read()).branches.mill.bags[0], 1);
  await click("恢复观察角度");
  await p.screenshot({ path: out + "/spatial-mill.png" });
  checks.push(
    "3D磨柄真实圆周拖动增加四分之一圈；场景面粉和篮子可点选分配且不能凭空复制",
  );
  await p.goto(url + "/?edition=3.1&story=sea");
  await ready();
  await click("从上面看");
  for (const [x, z] of [
    [0, 1],
    [0, 0],
    [2, 0],
    [4, 0],
  ])
    await tap([(x - 2) * 1.5, 0.04, (z - 1.5) * 1.5], "sea");
  assert.deepEqual((await read()).branches.sea.sail, [
    { dir: "N", strength: 2 },
    { dir: "N", strength: 1 },
    { dir: "E", strength: 2 },
    { dir: "E", strength: 2 },
  ]);
  await click("扬帆，试试这条路");
  assert.equal((await read()).branches.sea.result.ok, true);
  assert.equal(
    await p.locator(".sp-world").getAttribute("data-ink-strokes"),
    "1",
  );
  await click("恢复观察角度");
  await p.screenshot({ path: out + "/spatial-sea.png" });
  checks.push("点选海面排出真实风向与步数，逐格归岸，保留学生原笔迹纹理");
  let water = fresh();
  water.chapter = "river";
  water.visited = ["brush", "river"];
  water.river.support = true;
  water.river.power = "wheel";
  water = draw(water, "river", [
    {
      ...ink[0],
      points: [
        [80, 340],
        [180, 340],
        [180, 120],
        [720, 120],
      ],
    },
  ]);
  water = testDrawing(water, "river");
  await p.evaluate(({ k, w }) => localStorage.setItem(k, JSON.stringify(w)), {
    k: KEY,
    w: water,
  });
  await p.goto(url + "/?edition=3.1&story=water");
  await click("走进我的水路图");
  await ready();
  assert.equal(
    await p.locator(".sp-world").getAttribute("data-result"),
    "true",
  );
  await p.screenshot({ path: out + "/spatial-water.png" });
  await p.keyboard.press("Escape");
  assert.equal(await p.locator(".sp-river-dialog").count(), 0);
  assert.equal(
    await p
      .getByRole("button", { name: "走进我的水路图" })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  assert.deepEqual(
    await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY),
    water,
  );
  checks.push("水路立体观察读取实际试水，弹窗关闭归还焦点且不改变证据");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    for (const id of ["map", "cow", "mill", "sea"]) {
      await p.goto(url + "/?edition=3.1&story=" + id);
      await ready();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        width + id,
      );
      const host = await p.locator(".sp-world").boundingBox();
      assert.ok(host.width > 250);
      if (width === 390 && id === "cow")
        await p.screenshot({ path: out + "/spatial-mobile.png" });
    }
  }
  checks.push("五档视口无横向溢出，窄屏相机自动退后，模型可完整观察");
  await p.goto(url + "/?edition=3.1&story=cow");
  await ready();
  const state = (await read()).branches.cow;
  await p
    .locator(".sp-world canvas")
    .evaluate((c) =>
      c.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext(),
    );
  await p.getByText("已换成平面图，画、试和记录都能继续。").waitFor();
  assert.ok(await p.locator(".w3-game-grid").isVisible());
  assert.deepEqual((await read()).branches.cow, state);
  checks.push("运行中WebGL上下文丢失自动退回平面，作品和计划不丢失");
  const nc = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await nc.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      if (t === "webgl2" || t === "webgl" || t === "experimental-webgl")
        return null;
      return orig.call(this, t, ...a);
    };
  });
  const np = await nc.newPage();
  await np.goto(url + "/?edition=3.1&story=cow");
  await np.getByRole("button", { name: "画一头耕牛", exact: true }).click();
  await np.locator(".w3-paper").focus();
  await np.keyboard.press("Enter");
  await np.keyboard.press("ArrowRight");
  await np.keyboard.press("Enter");
  await np.keyboard.press("Escape");
  await np
    .getByRole("button", { name: "画好了，让它走进故事", exact: true })
    .click();
  await np.getByText("已换成平面图，画、试和记录都能继续。").waitFor();
  await np.getByRole("button", { name: "加入向右", exact: true }).click();
  await np.getByRole("button", { name: "请耕牛走一走", exact: true }).click();
  await np.getByRole("button", { name: "先收好这一次", exact: true }).waitFor();
  await nc.close();
  checks.push("WebGL不可用设备仍可键盘作画、排路、试做和进入章末");
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + "/spatial-results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(checks.join("\n"));
} catch (e) {
  await p.screenshot({ path: out + "/spatial-failure.png", fullPage: true });
  throw e;
} finally {
  await browser.close();
}

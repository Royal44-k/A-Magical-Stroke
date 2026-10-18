import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  SpeakerHigh,
  Leaf,
  PaintBrush,
  Check,
  Compass,
  Users,
  Gear,
  X,
} from "@phosphor-icons/react";
import AppV2 from "../v2/AppV2.jsx";
import { KEY, restore, fresh, ending, ENDINGS } from "../v2/engine.mjs";
import {
  WORLD_KEY,
  STORIES,
  freshWorld,
  restoreWorld,
  revise,
  indicators,
  chapterRecord,
  reportHtml,
  DIR_NAMES,
} from "./model.mjs";
import SketchPad, { Sketch } from "./SketchPad.jsx";
import { CowGame, MillGame, SeaGame } from "./Games.jsx";
import "./v3.css";
import "../spatial/spatial.css";
import Village from "../spatial/Village.jsx";
import { FullscreenButton } from "../spatial/Spatial.jsx";
const A = "/assets/";
const TEXT = {
  cow: {
    speaker: "鲁伯",
    speech: "“种子备好了，可田还没耕。田边的小苗，千万别碰着。”",
    story:
      "马良在田埂上停下脚步。鲁伯握着木犁，望着一块块还没翻开的田。小禾蹲下来，在纸上画出田的位置。",
    paint: "画一头耕牛",
    purpose: "你的耕牛有什么特别的地方？",
    hint: "先找出发处，再看看小苗和石头。方向牌一张一张排，试过还能改。",
    after:
      "鲁伯扶着犁走过新翻的土，笑着说：“这下能播种了！”小禾蹲下看了看，田边的小苗一棵也没少。",
    next: "会画一头牛，还要想清它怎样帮忙。把路线讲给鲁伯听，他明天也能照着做。",
  },
  mill: {
    speaker: "周婶",
    speech: "“石磨有了！三家共六口人，每人要两份面粉。你能帮着分一分吗？”",
    story:
      "麦子晒干了，周婶却为磨面发愁。马良画下一座石磨。磨柄轻轻一推，石盘便转了起来。小禾想请你画一只结实的粮袋，把面粉好好收住。",
    paint: "画一只粮袋",
    purpose: "你给粮袋画了什么，方便大家装面粉？",
    hint: "一圈有四个四分之一圈。每转一次磨出3份。分好后，按每家人数再数一数。",
    after:
      "周婶数了六份，鲁伯收了四份，阿婆带走两份。院子里飘出面香。小禾说：“三家拿到的份数不同，每个人却一样多！”",
    next: "袋子分得一样多，不一定每个人一样多。先弄清人数，再决定怎样分。",
  },
  sea: {
    speaker: "船夫",
    speech: "“有人只顾着金山，可大家都想回家。你愿意帮我们找路吗？”",
    story:
      "大官催着马良画出海上的金山，还要坐船去取金子。岸上的灯一盏盏亮了，船上的人却迟迟不能回家。马良放下画笔，望向你：“这一次，让风往哪里吹？”",
    paint: "画一面船帆",
    purpose: "这面帆准备带船上的人去哪里？",
    hint: "这里的箭头表示风吹去的方向。大一点的风走2格，中间的那一格也不能撞上礁石。",
    after:
      "船轻轻靠岸，等候的人迎了上来。小禾收起帆：“金山还在远处，大家已经平平安安到家了。”马良把笔放回怀里。",
    next: "有了神笔，也要想一想这一路会影响谁。先看看方向，再让办法试着走一走。",
  },
};
const phases = [
  ["intro", "听听故事"],
  ["draw", "亲手画"],
  ["play", "试办法"],
  ["ending", "收好这一章"],
];
const save = (name, html) => {
  const u = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
};
function printReport(w, water) {
  const f = document.createElement("iframe");
  f.title = "成长画卷打印预览";
  f.style.cssText = "position:fixed;width:1px;height:1px;left:-10000px;top:0";
  f.onload = () => {
    f.contentWindow.addEventListener("afterprint", () => f.remove(), {
      once: true,
    });
    f.contentWindow.focus();
    f.contentWindow.print();
  };
  f.srcdoc = reportHtml(w, water);
  document.body.append(f);
}
function readWater() {
  try {
    return restore(localStorage.getItem(KEY)) || fresh();
  } catch {
    return fresh();
  }
}
function NewRoll({ onClose, onSave, onNew }) {
  const r = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    r.current.showModal();
    return () => prev?.focus?.();
  }, []);
  return (
    <dialog
      className="w3-new-roll"
      ref={r}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2>先收好这一张，再开新画卷</h2>
      <p>
        新画卷会清空当前四章的画和记录。已经下载的报告仍能打开。换一位同学时，也请先收好自己的报告。
      </p>
      <div className="w3-actions">
        <button onClick={onSave}>先下载我的报告</button>
        <button className="w3-main-button" onClick={onNew}>
          收好了，打开新画卷
        </button>
        <button onClick={onClose}>还要接着画</button>
      </div>
    </dialog>
  );
}
function Report({ w, water, setW, onGo, onBack }) {
  const rows = indicators(w, water),
    records = STORIES.map((s) => ({ ...s, ...chapterRecord(s.id, w, water) })),
    closed = records.filter((r) => r.closed).length;
  return (
    <main className="w3-report">
      <div className="w3-report-heading">
        <span className="w3-eyebrow">画卷收好了，发现带回家</span>
        <h1>我的成长画卷</h1>
        <p>
          {closed === 4
            ? "四段故事，都留下了你的脚印。"
            : closed
              ? "今天先收好" + closed + "章，其他故事还在等你。"
              : "画卷刚刚展开。等你画过、试过，发现就会留在这里。"}
        </p>
        <small>{w.id} · 保存在这台设备中</small>
        <div className="w3-actions">
          <button
            className="w3-main-button"
            onClick={() =>
              save("我的成长画卷-" + w.id + ".html", reportHtml(w, water))
            }
          >
            <Download />
            带走我的报告
          </button>
          <button onClick={() => printReport(w, water)}>打印这份画卷</button>
          <button onClick={onBack}>回到故事画卷</button>
        </div>
      </div>
      <section className="w3-chapter-results" aria-label="四章的结果">
        {records.map((r) => (
          <button key={r.id} onClick={() => onGo(r.id)}>
            <span>{r.closed ? "已收好" : "继续探索"}</span>
            <h2>{r.title}</h2>
            <p>{r.message}</p>
            <b>
              {r.closed && !r.ok ? "回去补一补" : "翻开这一章"} <ArrowRight />
            </b>
          </button>
        ))}
      </section>
      <h2 className="w3-section-heading">这些本领，留下了什么证据？</h2>
      <p>先看自己的作品和试做记录，再和老师、伙伴一起说一说。</p>
      <div className="w3-indicators">
        {rows.map((r, i) => (
          <article key={r.id}>
            <div className="w3-indicator-heading">
              <span className="w3-seal">
                {["言", "画", "数", "试", "伴"][i]}
              </span>
              <div>
                <small>{r.subject}</small>
                <h3>{r.title}</h3>
              </div>
              <b>{r.status}</b>
            </div>
            <p>{r.evidence}</p>
            <p className="w3-next">下一步：{r.next}</p>
            <small>{r.limit}</small>
            <details className="w3-observation">
              <summary>和老师、伙伴一起看</summary>
              <label>
                听过讲述、看过作品以后再记录
                <select
                  aria-label={r.subject + "交流评价"}
                  value={w.observations?.[r.id] || ""}
                  onChange={(e) =>
                    setW((n) => ({
                      ...n,
                      observations: {
                        ...n.observations,
                        [r.id]: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="">还没一起交流</option>
                  <option value="prompt">借助提示，试着说明</option>
                  <option value="evidence">能结合这次的证据说明</option>
                  <option value="transfer">能在新的任务中运用</option>
                </select>
              </label>
              <p>
                这项由一起交流的人选择，不由程序代填。具体观察要点见教师指南。
              </p>
            </details>
          </article>
        ))}
      </div>
      <h2 className="w3-section-heading">我画过，也试过</h2>
      <div className="w3-portfolio">
        {STORIES.map((s) => {
          const waterStory = s.id === "water",
            b = w.branches[s.id];
          return (
            <article key={s.id}>
              <h3>{s.title}</h3>
              {waterStory ? (
                <>
                  <Sketch strokes={water.canopy.strokes} label="我画的伞" />
                  <Sketch strokes={water.river.strokes} label="我画的水路" />
                </>
              ) : (
                <Sketch strokes={b.strokes} label={TEXT[s.id].paint} />
              )}
              <p>
                {waterStory
                  ? water.note || "还想说给伙伴听。"
                  : b.note || "还没有写下自己的话。"}
              </p>
              {!waterStory && (
                <>
                  <p>
                    <small>
                      画的用处：{b.purpose || "可以指着画讲一讲。"} · 我自己看：
                      {b.self || "还没选"}
                    </small>
                  </p>
                  <details>
                    <summary>翻看试做记录 · {b.history.length}次</summary>
                    {b.history.length ? (
                      b.history.map((t, i) => (
                        <div className="w3-trial" key={i}>
                          <strong>
                            记录{i + 1} ·{" "}
                            {t.result.ok ? "办法试成了" : "留下一个问题"}
                          </strong>
                          <p>{t.result.message}</p>
                          <p>
                            {s.id === "cow"
                              ? "路线：" +
                                t.route.map((d) => DIR_NAMES[d]).join("、")
                              : s.id === "mill"
                                ? "转了" +
                                  t.quarters +
                                  "个四分之一圈，三家分到" +
                                  t.bags.join("、") +
                                  "份。"
                                : "风向：" +
                                  t.sail
                                    .map(
                                      (m) =>
                                        DIR_NAMES[m.dir] + m.strength + "格",
                                    )
                                    .join("、")}
                          </p>
                          <Sketch
                            strokes={t.strokes}
                            label={"记录" + (i + 1) + "里的画"}
                          />
                        </div>
                      ))
                    ) : (
                      <p>试过一次，记录就会留在这里。</p>
                    )}
                  </details>
                </>
              )}
              <button onClick={() => onGo(s.id)}>带着发现再去试试</button>
            </article>
          );
        })}
      </div>
      <label className="w3-own-words">
        老师或伙伴的话
        <textarea
          value={w.teacher}
          maxLength={800}
          onChange={(e) => setW((n) => ({ ...n, teacher: e.target.value }))}
          placeholder="可以写：我看见你……，下一回不妨……。"
        />
      </label>
      <details className="w3-teacher-details">
        <summary>评价依据与课堂使用</summary>
        <p>
          参照义务教育课程标准（2022年版）的表达交流、美术实践、数学应用、探究和合作方向，制定本案例的任务指标。程序只核对具体操作；表达质量、创意和真实合作表现由师生交流评价。没有总分和排名。
        </p>
        <a href="/teacher-guide-v31.html" target="_blank" rel="noreferrer">
          查看学段建议、指标和证据说明
        </a>
      </details>
      <footer className="w3-report-end">
        <Leaf />
        <h2>画卷合上，办法留下。</h2>
        <p>下一次遇到难题，你想先观察什么，再动哪一笔？</p>
        <button className="w3-main-button" onClick={onBack}>
          回村里，看看别的故事
        </button>
      </footer>
    </main>
  );
}
function BranchEnding({ id, b, set, onReport, onMap }) {
  const t = TEXT[id],
    ok = !!b.result?.ok,
    repair = b.history.some((h) => !h.result.ok) && ok;
  return (
    <section className="w3-chapter-ending">
      <div className={"w3-ending-title " + (ok ? "success" : "")}>
        <span className="w3-seal">{ok ? "成" : "续"}</span>
        <span className="w3-eyebrow">
          {STORIES.find((s) => s.id === id).title} ·{" "}
          {ok ? "本章落幕" : "这一回先停在这里"}
        </span>
        <h2>
          {ok
            ? repair
              ? "改了一处，事情不一样了"
              : id === "cow"
                ? "田翻好了，小苗还在"
                : id === "mill"
                  ? "三家人，都领到了面粉"
                  : "灯火就在岸边"
            : "这个问题，已经记下了"}
        </h2>
        <p>{ok ? t.after : b.result?.message}</p>
      </div>
      <div className="w3-ending-evidence">
        <Sketch strokes={b.strokes} label="这一次亲手画的作品" />
        <div>
          <h3>这一笔，带来了什么？</h3>
          <p>{b.result?.message}</p>
          <p>
            {ok
              ? t.next
              : "画和试做记录都留下了。先看看卡在哪里，回去改一处，再试一次。"}
          </p>
          <button onClick={() => set({ ...b, phase: "play", closed: false })}>
            回去改一改
          </button>
        </div>
      </div>
      <label className="w3-own-words">
        指着画，说说你的发现
        <textarea
          maxLength={400}
          value={b.note}
          placeholder="我先……，试过以后发现……，所以我……。也可以说给老师或伙伴听。"
          onChange={(e) => set({ ...b, note: e.target.value })}
        />
      </label>
      <fieldset className="w3-self">
        <legend>这一次，我想这样说</legend>
        {["能讲清楚", "还想试试", "想请伙伴帮忙"].map((v) => (
          <button
            key={v}
            aria-pressed={b.self === v}
            onClick={() => set({ ...b, self: v })}
          >
            {v}
          </button>
        ))}
      </fieldset>
      <div className="w3-actions">
        <button className="w3-main-button" onClick={onReport}>
          <BookOpen />
          看看我的学习反馈
        </button>
        <button onClick={onMap}>收好这一章，回到画卷</button>
      </div>
    </section>
  );
}
export default function AppV3() {
  const [w, setW] = useState(() => {
      try {
        return restoreWorld(localStorage.getItem(WORLD_KEY)) || freshWorld();
      } catch {
        return freshWorld();
      }
    }),
    [water, setWater] = useState(readWater),
    [view, setView] = useState(() => {
      const s = new URLSearchParams(location.search).get("story");
      return STORIES.some((x) => x.id === s)
        ? s
        : s === "report"
          ? "report"
          : "map";
    }),
    [hint, setHint] = useState(false),
    [teacher, setTeacher] = useState(false),
    [restart, setRestart] = useState(false),
    [storage, setStorage] = useState(true),
    [systemQuiet, setSystemQuiet] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [speaking, setSpeaking] = useState(false),
    heading = useRef(null);
  const story = STORIES.find((s) => s.id === view),
    b = w.branches[view],
    quiet = w.quiet || systemQuiet;
  useEffect(() => {
    try {
      localStorage.setItem(WORLD_KEY, JSON.stringify(w));
      setStorage(true);
    } catch {
      setStorage(false);
    }
  }, [w]);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)"),
      fn = () => setSystemQuiet(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
    setHint(false);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [view, b?.phase]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const go = useCallback((id) => {
    setView(id);
    const url = new URL(location.href);
    if (id === "map") url.searchParams.delete("story");
    else url.searchParams.set("story", id);
    history.replaceState(null, "", url);
  }, []);
  const setBranch = (change) =>
    setW((n) => ({
      ...n,
      branches: {
        ...n.branches,
        [view]:
          typeof change === "function" ? change(n.branches[view]) : change,
      },
    }));
  const listen = (text) => {
    if (!("speechSynthesis" in window)) {
      setHint(true);
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.85;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(u);
  };
  if (view === "water")
    return (
      <AppV2
        onMap={() => go("map")}
        onReport={() => go("report")}
        onStateChange={setWater}
      />
    );
  return (
    <div
      className={
        "w3 sp-app sp-view-" +
        view +
        " sp-phase-" +
        (b?.phase || "none") +
        " " +
        (quiet ? "w3-quiet" : "")
      }
    >
      <header className="w3-header">
        <button className="w3-brand" onClick={() => go("map")}>
          奇幻一笔<small>神笔马良</small>
        </button>
        {story ? (
          <button onClick={() => go("map")}>
            <ArrowLeft />
            故事画卷
          </button>
        ) : (
          <span className="w3-header-line">一支笔，许多种可能。</span>
        )}
        <nav>
          <FullscreenButton />
          <button aria-label="我的成长画卷" onClick={() => go("report")}>
            <BookOpen />
            <span>成长画卷</span>
          </button>
          <button
            aria-label="让画面安静些"
            aria-pressed={quiet}
            onClick={() => setW((n) => ({ ...n, quiet: !n.quiet }))}
          >
            <Gear />
            <span>{quiet ? "画面已安静" : "让画面安静些"}</span>
          </button>
          <button aria-label="另开一张画卷" onClick={() => setRestart(true)}>
            <PaintBrush />
            <span>新画卷</span>
          </button>
          <button aria-label="教师" onClick={() => setTeacher(!teacher)}>
            <Users />
            <span>教师</span>
          </button>
        </nav>
      </header>
      {!storage && (
        <p className="w3-storage-warning" role="alert">
          这台设备没能保存新记录。请先打开成长画卷，下载报告，再离开页面。
        </p>
      )}
      {restart && (
        <NewRoll
          onClose={() => setRestart(false)}
          onSave={() =>
            save("我的成长画卷-" + w.id + ".html", reportHtml(w, water))
          }
          onNew={() => {
            const next = fresh();
            try {
              localStorage.setItem(KEY, JSON.stringify(next));
            } catch {
              setStorage(false);
            }
            setWater(next);
            setW(freshWorld());
            setRestart(false);
            go("map");
          }}
        />
      )}
      {teacher && (
        <aside className="w3-teacher-panel">
          <button
            className="w3-close"
            aria-label="收起教师说明"
            onClick={() => setTeacher(false)}
          >
            <X />
          </button>
          <h2>四段故事，四种解决问题的办法</h2>
          <p>
            小学四至六年级，可分课选择一章。先听需要，再画、试、改，最后指着证据讲一讲。每章可暂停，失败的记录也能保留。
          </p>
          <a href="/teacher-guide-v3.html" target="_blank" rel="noreferrer">
            打开完整课堂指南与评价指标
          </a>
          <p>
            学生作品只存在本机；成长画卷可下载或打印。共用设备时，先下载当前报告，再点“新画卷”，为下一位同学打开空白画卷。
          </p>
        </aside>
      )}
      {view === "map" && (
        <Village w={w} water={water} go={go} quiet={quiet} heading={heading} />
      )}
      {view === "report" && (
        <Report
          w={w}
          water={water}
          setW={setW}
          onGo={go}
          onBack={() => go("map")}
        />
      )}
      {b && (
        <main className={"w3-branch " + view}>
          <header className="w3-branch-heading">
            <span className="w3-eyebrow">{story.subject}</span>
            <h1 ref={heading} tabIndex={-1}>
              {story.title}
            </h1>
            <nav aria-label="这一章的脚步">
              {phases.map(([p, label], i) => (
                <button
                  key={p}
                  aria-current={b.phase === p ? "step" : undefined}
                  disabled={
                    (p === "play" && !b.strokes.length) ||
                    (p === "ending" && !b.result)
                  }
                  onClick={() =>
                    setBranch({
                      ...b,
                      phase: p,
                      closed: p === "ending" ? true : b.closed,
                    })
                  }
                >
                  <span>{i + 1}</span>
                  {label}
                </button>
              ))}
            </nav>
          </header>
          {b.phase === "intro" && (
            <section className="w3-story-intro">
              <img src={A + story.image} alt={story.title + "的故事场景"} />
              <div>
                <span className="w3-eyebrow">听听村里的事</span>
                <p>{TEXT[view].story}</p>
                <blockquote>
                  <strong>{TEXT[view].speaker}</strong>
                  {TEXT[view].speech}
                </blockquote>
                <div className="w3-actions">
                  <button
                    className="w3-main-button"
                    onClick={() => setBranch({ ...b, phase: "draw" })}
                  >
                    <PaintBrush />
                    {TEXT[view].paint}
                  </button>
                  <button
                    onClick={() => listen(TEXT[view].story + TEXT[view].speech)}
                  >
                    <SpeakerHigh />
                    {speaking ? "停下朗读" : "读给我听"}
                  </button>
                </div>
              </div>
            </section>
          )}
          {b.phase === "draw" && (
            <section className="w3-drawing-chapter">
              <div className="w3-task-heading">
                <h2>{TEXT[view].paint}</h2>
                <p>
                  {view === "cow"
                    ? "这头牛会跟着你排的方向牌，一块一块地耕田。"
                    : view === "mill"
                      ? "面粉会装进你的粮袋。袋口、袋身想画成什么样？"
                      : "把想画的花纹画在帆上。等一会儿，它会挂在船上，跟着你安排的风出发。"}
                </p>
              </div>
              <SketchPad
                strokes={b.strokes}
                title={TEXT[view].paint}
                onChange={(strokes) => setBranch((n) => revise(n, { strokes }))}
              />
              <label className="w3-own-words small">
                {TEXT[view].purpose}
                <input
                  value={b.purpose}
                  maxLength={120}
                  onChange={(e) => setBranch({ ...b, purpose: e.target.value })}
                  placeholder="可以写一句，也可以等会儿指着画说。"
                />
              </label>
              <button
                className="w3-main-button"
                disabled={!b.strokes.length}
                onClick={() => setBranch({ ...b, phase: "play" })}
              >
                画好了，让它走进故事
                <ArrowRight />
              </button>
            </section>
          )}
          {b.phase === "play" &&
            (view === "cow" ? (
              <CowGame
                b={b}
                set={setBranch}
                quiet={quiet}
                onEnd={() => setBranch({ ...b, closed: true, phase: "ending" })}
              />
            ) : view === "mill" ? (
              <MillGame
                quiet={quiet}
                b={b}
                set={setBranch}
                onEnd={() => setBranch({ ...b, closed: true, phase: "ending" })}
              />
            ) : (
              <SeaGame
                b={b}
                set={setBranch}
                quiet={quiet}
                onEnd={() => setBranch({ ...b, closed: true, phase: "ending" })}
              />
            ))}
          {b.phase === "ending" && (
            <BranchEnding
              id={view}
              b={b}
              set={setBranch}
              onReport={() => go("report")}
              onMap={() => go("map")}
            />
          )}
        </main>
      )}
      {b && (
        <aside className="w3-companion">
          {hint && (
            <div className="w3-companion-talk" role="status">
              <strong>小禾陪你想</strong>
              <p>
                {b.phase === "ending"
                  ? b.result?.ok
                    ? "你留下了一个用得上的办法！挑一处发现，说给伙伴听吧。"
                    : b.result?.message
                  : b.phase === "draw"
                    ? "不用画得和别人一样。想一想这幅画有什么用，再画出自己的样子。"
                    : TEXT[view].hint}
              </p>
              <button onClick={() => setHint(false)}>我来试试</button>
            </div>
          )}
          <button aria-label="请小禾帮我想一想" onClick={() => setHint(!hint)}>
            <img src={A + "xiaohe-guide-v1.png"} alt="小禾" />
            <span>小禾陪你想</span>
          </button>
        </aside>
      )}
    </div>
  );
}

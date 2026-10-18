import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  PaintBrush,
  SpeakerHigh,
  X,
  Check,
} from "@phosphor-icons/react";
import {
  KEY4,
  CHAPTERS,
  SCENARIOS,
  fresh4,
  freshDesign,
  restore4,
  edit,
  run4,
  evidence4,
  report4,
  drawingSvg,
} from "./model.mjs";
import {
  CowBoard,
  MillBoard,
  SailBoard,
  WindPlan,
  SeaMap,
  Playback,
} from "./Boards.jsx";
import AppV2 from "../v2/AppV2.jsx";
import {
  KEY,
  restore,
  fresh,
  ending,
  ENDINGS,
  strokesSvg,
} from "../v2/engine.mjs";
import { freshWorld, STORIES } from "../v3/model.mjs";
import Village from "../spatial/Village.jsx";
import { FullscreenButton } from "../spatial/Spatial.jsx";
import "../v3/v3.css";
import "../spatial/spatial.css";
import "./v4.css";
const getWater = () => {
  try {
    return restore(localStorage.getItem(KEY)) || fresh();
  } catch {
    return fresh();
  }
};
const download = (w) => {
  const url = URL.createObjectURL(
      new Blob([report4(w, getWater())], { type: "text/html;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "我的神笔研究手册-" + w.id + ".html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const stories = STORIES.map((s) =>
  s.id === "water"
    ? s
    : {
        ...s,
        tag: {
          cow: "画路线 · 算面积 · 找省力办法",
          mill: "画分粮图 · 比人数 · 说公平",
          sea: "设计船帆 · 试风力 · 规划归航",
        }[s.id],
      },
);
function Reference({ id, scenario }) {
  const c = CHAPTERS[id];
  return (
    <details className="q4-reference">
      <summary>动笔前，看清要求</summary>
      <ul>
        {(scenario ? [c.change] : c.needs).map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      {id === "cow" && (
        <p>
          直走：每走一格用{scenario ? 2 : 1}
          份力气。拐弯：在走格子之外，再用1份。同一块田经过两遍，面积只算一次。
        </p>
      )}
      {id === "sea" && (
        <p>
          这里用格子比较帆的大小和船的脚步。把一阵风的帆收小，船只走1格。每一步都要检查礁石。
        </p>
      )}
    </details>
  );
}
function Reflection({ id, d, patch }) {
  const c = CHAPTERS[id];
  return (
    <div className="q4-reflection">
      <div>
        <span className="q4-kicker">把发现说清楚</span>
        <h2>这一笔，为什么有用？</h2>
        <p>{c.moral}</p>
        <p className="q4-note">
          可以写下来，也可以指着图向老师、伙伴讲。这里不会按字数给分。
        </p>
      </div>
      <div className="q4-writing">
        <label>
          我的办法是什么？
          <textarea
            value={d.claim}
            maxLength={600}
            onChange={(e) => patch({ claim: e.target.value })}
            placeholder={
              id === "cow"
                ? "我先……再……，这样可以……"
                : id === "mill"
                  ? "我按……分，因为……"
                  : "我把帆画成……，遇到……就……"
            }
          />
        </label>
        <label>
          哪一次试做能说明？
          <select
            aria-label="选择要讲述的试做"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value !== "") {
                const h = d.history[Number(e.target.value)];
                patch({
                  evidence: `第${Number(e.target.value) + 1}次：${h.result.metric} 我发现：`,
                });
              }
            }}
          >
            <option value="">选一次记录，再添上自己的发现</option>
            {d.history.map((h, i) => (
              <option key={i} value={i}>
                第{i + 1}次 · {h.result.ok ? "试成了" : "还要改"}
              </option>
            ))}
          </select>
          <textarea
            value={d.evidence}
            maxLength={600}
            onChange={(e) => patch({ evidence: e.target.value })}
            placeholder="我从……看出来，因为……"
          />
        </label>
        <label>
          {id === "mill"
            ? "如果我是另一家的人，我想说什么？"
            : "如果明天马良不在，怎样让别人接着用？"}
          <textarea
            value={d.next}
            maxLength={600}
            onChange={(e) => patch({ next: e.target.value })}
            placeholder="我还会……，这样……"
          />
        </label>
        <details className="q4-reference">
          <summary>老师、伙伴和我一起看</summary>
          <p>先看图、听说明，再记录。程序不替大家评价创意和理由。</p>
          <label>
            这一次交流看到的表现
            <select
              value={d.peer}
              onChange={(e) => patch({ peer: e.target.value })}
            >
              <option value="">还没有交流</option>
              <option>借助提示，能说出自己的办法</option>
              <option>能指着试做记录解释原因</option>
              <option>能比较两种办法，说明各自的影响</option>
            </select>
          </label>
        </details>
      </div>
    </div>
  );
}
function Ending({ id, b, onBack, onChange, onReport, onMap }) {
  const c = CHAPTERS[id],
    d = b.designs[b.scenario],
    r = d.result,
    changed = b.designs[1].result?.ok;
  return (
    <main className="q4-ending">
      <div className="q4-ending-art">
        <img src={"/assets/" + c.image} alt={c.title + "的故事画面"} />
        <span className="q4-end-seal">本章结束</span>
      </div>
      <section>
        <span className="q4-kicker">
          {r.ok ? "办法有了结果，故事还有回声" : "先收好发现，再回来添一笔"}
        </span>
        <h1>
          {r.ok
            ? {
                cow: "田醒了，明天就能播种。",
                mill: "面粉分好了，话也要说清楚。",
                sea: "灯火近了，船上的人笑了。",
              }[id]
            : "这一次，还留下一个难题。"}
        </h1>
        <p>{r.message}</p>
        <blockquote>
          {r.ok
            ? id === "cow"
              ? "鲁伯把你的路线收进竹筒：“明天照着走，就不用让牛来回折腾了。”小禾在田埂旁补上一句：“这几处小苗，也要一起记住。”"
              : id === "mill"
                ? r.consequence +
                  " 周婶摊开分粮图：“下回粮食、人数变了，我们就照着这张图重新商量。”"
                : "船夫系好缆绳，小禾把帆收起：“风变大时，收一收帆，也是在照顾船上的人。”马良望着岸边，终于把笔放回怀里。"
            : "小禾把图纸铺在桌上：“不用急着把它藏起来。刚才停下的地方，正好告诉我们下一笔该改哪里。”"}
        </blockquote>
        <div className="q4-outcome">
          <Check />
          <div>
            <strong>你留下的真实结果</strong>
            <p>{r.metric}</p>
            <small>
              {changed ? "换了条件，也已经试成。" : "新情况还可以接着探索。"}
            </small>
          </div>
        </div>
        <p>{c.moral}</p>
        <div className="q4-tools">
          <button className="q4-primary" onClick={onReport}>
            收好我的学习反馈
            <ArrowRight />
          </button>
          <button onClick={onBack}>回去改一改</button>
          {!changed && b.designs[0].result?.ok && (
            <button onClick={onChange}>再试“情况变了”</button>
          )}
          <button onClick={onMap}>回到村里</button>
        </div>
      </section>
    </main>
  );
}
function Report({ w, onGo, onMap }) {
  const water = getWater();
  return (
    <main className="q4-report">
      <header>
        <span className="q4-kicker">图纸会留下，发现会长大</span>
        <h1>我的神笔研究手册</h1>
        <p>
          {w.id} ·
          记录保存在这台设备上。每一项反馈，都能找到这次作品或试做的依据。
        </p>
        <div className="q4-tools">
          <button className="q4-primary" onClick={() => download(w)}>
            <Download />
            带走我的手册
          </button>
          <button
            onClick={() => {
              const f = document.createElement("iframe");
              f.title = "研究手册打印";
              f.style.cssText =
                "position:fixed;left:-9999px;width:1px;height:1px";
              f.onload = () => {
                f.contentWindow.addEventListener(
                  "afterprint",
                  () => f.remove(),
                  { once: true },
                );
                f.contentWindow.print();
              };
              f.srcdoc = report4(w, getWater());
              document.body.append(f);
            }}
          >
            打印手册
          </button>
          <button onClick={onMap}>回到村里</button>
        </div>
      </header>
      {Object.entries(CHAPTERS).map(([id, c]) => (
        <section key={id} className="q4-report-chapter">
          <header>
            <h2>{c.title}</h2>
            <button onClick={() => onGo(id)}>
              回到这一章
              <ArrowRight />
            </button>
          </header>
          <div className="q4-evidence-list">
            {evidence4(id, w.chapters[id]).map((e) => (
              <article key={e.title}>
                <span>{e.level}</span>
                <h3>{e.title}</h3>
                <p>{e.evidence}</p>
                <p className="q4-next">下一步：{e.next}</p>
              </article>
            ))}
          </div>
          {w.chapters[id].designs.map((d, s) => (
            <details className="q4-portfolio" key={s}>
              <summary>
                {SCENARIOS[s]} · {d.history.length}次试做 · 展开图纸和讲述
              </summary>
              <div dangerouslySetInnerHTML={{ __html: drawingSvg(id, d, s) }} />
              <p>{d.result?.message || "还没有试做。"}</p>
              <p>{d.claim || "我的办法还等着讲述。"}</p>
              <p>{d.evidence}</p>
              <p>{d.next}</p>
              <p>交流评价：{d.peer || "等待交流"}</p>
              <ol>
                {d.history.map((h, i) => (
                  <li key={i}>
                    第{i + 1}次 · {h.result.ok ? "试成" : "继续改"}：
                    {h.result.metric} 事先估计：
                    {h.snapshot.prediction || "未填写"}。
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </section>
      ))}
      <section className="q4-report-chapter">
        <h2>一笔清泉 · 水路故事</h2>
        <p>
          {water.endings.length
            ? ENDINGS[ending(water)][0]
            : "水路故事还在继续。"}
        </p>
        <p>{water.river.result?.message || "这张水路还没有试过。"}</p>
        <p>
          交给下一双手：
          {water.handoff.done ? "已经照图完成交接" : "还可以继续试做"}。保留了
          {water.river.tests.length}次试水记录。
        </p>
        <details className="q4-portfolio">
          <summary>展开我的水路作品</summary>
          <div
            dangerouslySetInnerHTML={{
              __html: strokesSvg(water.river.strokes),
            }}
          />
          <p>{water.note || "可以指着水路，讲讲这一路照顾了谁。"}</p>
        </details>
        <button onClick={() => onGo("water")}>
          回到水路故事，打开我的画册
        </button>
      </section>
    </main>
  );
}
export default function AppV4() {
  const [w, setW] = useState(() => {
      try {
        return restore4(localStorage.getItem(KEY4)) || fresh4();
      } catch {
        return fresh4();
      }
    }),
    [view, setView] = useState(() => {
      const id = new URLSearchParams(location.search).get("story");
      return CHAPTERS[id] || ["water", "report"].includes(id) ? id : "map";
    }),
    [water, setWater] = useState(getWater),
    [saved, setSaved] = useState(true),
    [showResult, setShowResult] = useState(false),
    [teacher, setTeacher] = useState(false),
    [restart, setRestart] = useState(false),
    [systemQuiet, setSystemQuiet] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const heading = useRef(),
    dialog = useRef();
  const b = w.chapters[view],
    c = CHAPTERS[view],
    d = b?.designs[b.scenario],
    quiet = w.quiet || systemQuiet;
  useEffect(() => {
    try {
      localStorage.setItem(KEY4, JSON.stringify(w));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [w]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      fn = () => setSystemQuiet(media.matches);
    media.addEventListener("change", fn);
    return () => media.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    heading.current?.focus();
    setShowResult(false);
    window.scrollTo(0, 0);
    window.speechSynthesis?.cancel();
  }, [view, b?.phase, b?.scenario]);
  useEffect(() => {
    if (restart) dialog.current?.showModal();
  }, [restart]);
  const go = (id) => {
    setView(id);
    const url = new URL(location.href);
    if (id === "map") url.searchParams.delete("story");
    else url.searchParams.set("story", id);
    history.replaceState(null, "", url);
  };
  const setB = (fn) =>
    setW((n) => ({
      ...n,
      chapters: { ...n.chapters, [view]: fn(n.chapters[view]) },
    }));
  const update = (fn) => {
    setShowResult(false);
    setB((n) => ({
      ...n,
      closed: false,
      designs: n.designs.map((v, i) =>
        i === n.scenario ? edit(v, typeof fn === "function" ? fn(v) : fn) : v,
      ),
    }));
  };
  const patch = (change) =>
    setB((n) => ({
      ...n,
      designs: n.designs.map((v, i) =>
        i === n.scenario ? { ...v, ...change } : v,
      ),
    }));
  const phase = (p) =>
    setB((n) => ({ ...n, phase: p, closed: p === "ending" ? true : n.closed }));
  const change = () =>
    setB((n) => {
      const source = n.designs[0];
      const hasStarted =
        n.designs[1].history.length ||
        n.designs[1].prediction ||
        n.designs[1].polygon.length ||
        n.designs[1].allocation.length ||
        n.designs[1].route.length > 1;
      return {
        ...n,
        scenario: 1,
        phase: "work",
        closed: false,
        designs: [
          source,
          hasStarted
            ? n.designs[1]
            : {
                ...freshDesign(),
                route: source.route.map((p) => [...p]),
                polygon: source.polygon.map((p) => [...p]),
                sealed: source.sealed,
                commands: source.commands.map((x) => ({ ...x })),
              },
        ],
      };
    });
  const villageW = freshWorld();
  for (const id of Object.keys(CHAPTERS)) {
    const last = w.chapters[id].designs[w.chapters[id].scenario].result;
    villageW.branches[id] = {
      ...villageW.branches[id],
      closed: w.chapters[id].closed,
      result: last ? { ...last, message: last.message } : null,
    };
  }
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
        "w3 q4 " +
        (quiet ? "w3-quiet" : "") +
        " q4-" +
        view +
        " q4-phase-" +
        (b?.phase || "map")
      }
    >
      <header className="q4-header">
        <button className="q4-brand" onClick={() => go("map")}>
          奇幻一笔<small>神笔马良</small>
        </button>
        {b && (
          <button onClick={() => go("map")}>
            <ArrowLeft />
            回村里
          </button>
        )}
        <nav>
          <FullscreenButton />
          <button aria-label="研究手册" onClick={() => go("report")}>
            <BookOpen />
            <span>研究手册</span>
          </button>
          <button
            aria-pressed={quiet}
            onClick={() => setW((n) => ({ ...n, quiet: !n.quiet }))}
          >
            {quiet ? "画面已安静" : "让画面安静些"}
          </button>
          <button onClick={() => setTeacher(!teacher)}>教师</button>
        </nav>
      </header>
      {!saved && (
        <p role="alert" className="q4-alert">
          这台设备没能保存新记录。请先下载研究手册，再离开页面。
        </p>
      )}
      {teacher && (
        <aside className="q4-teacher">
          <button aria-label="收起教师说明" onClick={() => setTeacher(false)}>
            <X />
          </button>
          <h2>让学生拿作品和证据说话</h2>
          <p>
            小学四至六年级。每章初试约20分钟，变式与交流可另用一课时。四年级先借方格与半份图理解数量，五六年级比较方案并解释取舍。
          </p>
          <a href="/teacher-guide-v4.html" target="_blank" rel="noreferrer">
            课堂指南、观察量规与模型说明
          </a>
          <p>本轮采用独立画卷，原有作品仍可查看。</p>
          <a href="/?edition=3.1&story=report" target="_blank" rel="noreferrer">
            打开原有成长画卷
          </a>
          <button onClick={() => setRestart(true)}>为下一位同学另开画卷</button>
        </aside>
      )}
      {restart && (
        <dialog
          ref={dialog}
          onCancel={(e) => {
            e.preventDefault();
            setRestart(false);
          }}
          className="q4-dialog"
        >
          <h2>先把自己的研究手册带走</h2>
          <p>
            新画卷会清空这次四段故事的当前记录。请先下载手册，图纸和试做记录都能离线打开。原有版本的其他画卷仍保留。
          </p>
          <button onClick={() => download(w)}>先下载手册</button>
          <button
            onClick={() => {
              const nextWater = fresh();
              try {
                localStorage.setItem(KEY, JSON.stringify(nextWater));
              } catch {
                setSaved(false);
              }
              setWater(nextWater);
              setW(fresh4());
              setRestart(false);
              go("map");
            }}
          >
            已收好，打开新画卷
          </button>
          <button onClick={() => setRestart(false)}>继续这张画卷</button>
        </dialog>
      )}
      {view === "map" && (
        <Village
          w={villageW}
          water={water}
          go={go}
          quiet={quiet}
          heading={heading}
          stories={stories}
        />
      )}
      {view === "report" && <Report w={w} onGo={go} onMap={() => go("map")} />}
      {b && b.phase !== "ending" && (
        <>
          <div className="q4-chapter-nav">
            <div>
              <span className="q4-kicker">{c.subject}</span>
              <h1 ref={heading} tabIndex={-1}>
                {c.title}
              </h1>
            </div>
            <nav aria-label="这一章的脚步">
              {[
                ["story", "听见难题"],
                ["work", "画、试、改"],
                ["reflect", "说出发现"],
              ].map(([p, label], i) => (
                <button
                  key={p}
                  aria-current={b.phase === p ? "step" : undefined}
                  disabled={p === "reflect" && !d.result}
                  onClick={() => phase(p)}
                >
                  <span>{i + 1}</span>
                  {label}
                </button>
              ))}
            </nav>
          </div>
          {b.phase === "story" && (
            <main className="q4-story">
              <img src={"/assets/" + c.image} alt={c.title + "的情境图"} />
              <section>
                <span className="q4-kicker">小禾邀你来帮忙</span>
                <h2>{c.art}</h2>
                <p>{c.intro}</p>
                <div className="q4-needs">
                  {c.needs.map((n, i) => (
                    <p key={n}>
                      <b>{i + 1}</b>
                      {n}
                    </p>
                  ))}
                </div>
                <button className="q4-primary" onClick={() => phase("work")}>
                  <PaintBrush />
                  铺开我的图纸
                  <ArrowRight />
                </button>
              </section>
            </main>
          )}
          {b.phase === "work" && (
            <main className="q4-workspace">
              <section className="q4-workbench">
                <div
                  className="q4-scenario-tabs"
                  role="group"
                  aria-label="两种情况"
                >
                  {SCENARIOS.map((s, i) => (
                    <button
                      key={s}
                      aria-pressed={b.scenario === i}
                      disabled={i === 1 && !b.designs[0].result?.ok}
                      onClick={() => {
                        if (i === 1) change();
                        else setB((n) => ({ ...n, scenario: 0 }));
                      }}
                    >
                      {s}
                      {b.designs[i].result?.ok && <Check />}
                    </button>
                  ))}
                  <span>
                    {b.scenario
                      ? "条件换了，再试试原来的办法。"
                      : "先想一想，再让图纸动起来。"}
                  </span>
                </div>
                {b.scenario === 1 && <p className="q4-changed">{c.change}</p>}
                {showResult && d.result ? (
                  <Playback
                    key={view + "-" + b.scenario}
                    id={view}
                    d={d}
                    quiet={quiet}
                  />
                ) : view === "cow" ? (
                  <CowBoard d={d} update={update} scenario={b.scenario} />
                ) : view === "mill" ? (
                  <MillBoard d={d} update={update} scenario={b.scenario} />
                ) : (
                  <div className="q4-sailing-table">
                    <div>
                      <SailBoard d={d} update={update} />
                    </div>
                    <aside>
                      <h3>回家的海图</h3>
                      <SeaMap />
                      <p className="q4-note">
                        左下角出发，右上角是岸。每一格都要绕开礁石。
                      </p>
                    </aside>
                  </div>
                )}
                {d.result && (
                  <button
                    className="q4-switch"
                    onClick={() => setShowResult(!showResult)}
                  >
                    {showResult ? "回到图纸，接着改" : "重看这次试做"}
                  </button>
                )}
                <details className="q4-history">
                  <summary>我的试做记录 · {d.history.length}次</summary>
                  {d.history.length ? (
                    <ol>
                      {d.history.map((h, i) => (
                        <li key={i}>
                          <strong>
                            第{i + 1}次 · {h.result.ok ? "试成" : "继续改"}
                          </strong>
                          <span>{h.result.metric}</span>
                          <small>
                            事先估计：{h.snapshot.prediction || "这次先观察"}
                            {h.snapshot.prediction ? c.unit : ""}；
                            {h.result.forecast === null
                              ? "还未比较"
                              : h.result.forecast
                                ? "和结果相符"
                                : "和结果不同，可以找找原因"}
                            。
                          </small>
                          <details>
                            <summary>看看当时的图</summary>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: drawingSvg(
                                  view,
                                  h.snapshot,
                                  b.scenario,
                                ),
                              }}
                            />
                          </details>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>
                      每种情况保留最近24次试做。图纸和结果一起留下，改过的地方也能回头比较。
                    </p>
                  )}
                </details>
              </section>
              <aside className="q4-task-panel">
                <span className="q4-kicker">当前要做的事</span>
                <h2>{c.art}</h2>
                <p>{c.hint}</p>
                <Reference id={view} scenario={b.scenario} />
                {view === "sea" && (
                  <>
                    <WindPlan d={d} update={update} scenario={b.scenario} />
                  </>
                )}
                <label className="q4-prediction">
                  {c.question}
                  <div>
                    <input
                      inputMode="decimal"
                      aria-label="试做前的估计"
                      value={d.prediction}
                      maxLength={20}
                      onChange={(e) =>
                        update({
                          prediction: e.target.value.replace(/[^0-9./]/g, ""),
                        })
                      }
                    />
                    <span>{c.unit}</span>
                  </div>
                  <small>
                    可以写整数、小数或分数（如3/2）。拿不准也可以先观察。
                  </small>
                </label>
                <button
                  className="q4-primary q4-test"
                  onClick={() => {
                    setB((n) => ({
                      ...n,
                      designs: n.designs.map((v, i) =>
                        i === n.scenario ? run4(view, v, n.scenario) : v,
                      ),
                    }));
                    setShowResult(true);
                  }}
                >
                  让神笔试一试
                  <ArrowRight />
                </button>
                {d.result && (
                  <div
                    className={"q4-feedback " + (d.result.ok ? "good" : "")}
                    role="status"
                  >
                    <strong>
                      {d.result.ok
                        ? "这个办法试成了！"
                        : "看见问题，就有了改的方向。"}
                    </strong>
                    <p>{d.result.message}</p>
                    <p>{d.result.metric}</p>
                    <small>
                      {d.result.forecast === null
                        ? "这次先观察。下次可以带着估计来试。"
                        : d.result.forecast
                          ? "你的估计和这次的结果相符。"
                          : "估计和结果不同。对照脚步、份数或帆面，找找原因。"}
                    </small>
                    {view === "mill" && <p>{d.result.consequence}</p>}
                    <div className="q4-tools">
                      <button onClick={() => phase("reflect")}>
                        把发现讲清楚
                      </button>
                      {b.scenario === 0 && d.result.ok && (
                        <button onClick={change}>挑战：情况变了</button>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            </main>
          )}
          {b.phase === "reflect" && (
            <main className="q4-reflect-page">
              <Reflection id={view} d={d} patch={patch} />
              <div className="q4-tools">
                <button className="q4-primary" onClick={() => phase("ending")}>
                  带着发现，看看结尾
                  <ArrowRight />
                </button>
                <button onClick={() => phase("work")}>回图纸再试一试</button>
                {b.scenario === 0 && d.result?.ok && (
                  <button onClick={change}>再试一种新情况</button>
                )}
              </div>
            </main>
          )}
        </>
      )}
      {b?.phase === "ending" && (
        <Ending
          id={view}
          b={b}
          onBack={() => phase("work")}
          onChange={change}
          onMap={() => go("map")}
          onReport={() => go("report")}
        />
      )}
      {b && (
        <footer className="q4-companion">
          <img src="/assets/xiaohe-guide-v1.png" alt="陪你研究的小禾" />
          <div>
            <b>小禾</b>
            <span>
              {b.phase === "ending"
                ? "把做成的事和还想改的地方，都收进手册吧。"
                : b.phase === "reflect"
                  ? "选一次真实试做，说清“我从哪里看出来”。"
                  : d.result?.ok
                    ? "你让图纸派上用场了。换个情况，还能行吗？"
                    : c.hint}
            </span>
          </div>
          <button
            aria-label="听小禾读提示"
            onClick={() => {
              if (!window.speechSynthesis) return;
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(c.hint);
              u.lang = "zh-CN";
              u.rate = 0.85;
              window.speechSynthesis.speak(u);
            }}
          >
            <SpeakerHigh />
          </button>
        </footer>
      )}
    </div>
  );
}

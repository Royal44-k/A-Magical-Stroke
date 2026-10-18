import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  House,
  PaintBrush,
  Play,
  Pause,
  X,
  Check,
  Hand,
  Users,
  Drop,
  ArrowClockwise,
  Download,
  SpeakerHigh,
  Gear,
  Question,
} from "@phosphor-icons/react";
import RiverView from "../spatial/RiverView.jsx";
import {FullscreenButton} from "../spatial/Spatial.jsx";
import PaintBoard, { Artwork } from "./PaintBoard.jsx";
import {
  KEY,
  CHAPTERS,
  fresh,
  restore,
  go,
  draw,
  testDrawing,
  prepareRiver,
  arrangeBridge,
  testBridge,
  setOffer,
  confirmAgreement,
  agreementReady,
  ending,
  finish,
  ENDINGS,
  albumHtml,
  strokesSvg,
} from "./engine.mjs";
import "./v2.css";
import Journal from "./Journal.jsx";
import Handoff from "./Handoff.jsx";
const A = "/assets/";
const TITLE = {
  brush: "雨夜，画一把伞",
  river: "给水画一条路",
  offer: "画笔交给谁",
  handoff: "交给下一双手",
  ending: "看看这一回",
};
const HINT = {
  brush: "先在画纸上方画一条宽宽的伞面。画好后，落一阵雨试试。",
  river: "从蓝色出水口开始画。水要到田边，门前也得给人留条路。",
  offer: "粮袋能解眼前的难处。卷轴上的话，会影响以后谁能用水。",
  handoff: "先把做法排好，再指给小禾看。水到田边以后，还要停水、收工具。",
  ending: "不必把问题藏起来。想清楚要补哪一笔，就回去试试。",
};
function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus?.();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"v2-dialog " + (wide ? "wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="关闭">
          <X />
        </button>
      </header>
      <div className="v2-dialog-body">{children}</div>
    </dialog>
  );
}
const saveFile = (name, data, type = "text/html") => {
  const u = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
function SceneFilm({ id, poster, clips, quiet, title }) {
  const [playing, setPlaying] = useState(false),
    [failed, setFailed] = useState(false),
    v = useRef(null);
  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [id]);
  useEffect(() => {
    if (quiet) {
      v.current?.pause();
      setPlaying(false);
    }
  }, [quiet]);
  const c = clips[id];
  return (
    <div className="v2-film">
      {playing && c && !failed ? (
        <video
          ref={v}
          src={c.src}
          poster={A + poster}
          autoPlay
          controls
          playsInline
          onEnded={() => setPlaying(false)}
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        >
          {c.captions && (
            <track
              kind="captions"
              src={c.captions}
              srcLang="zh"
              label="中文"
              default
            />
          )}
        </video>
      ) : (
        <img src={A + poster} alt={title} />
      )}
      <div className="v2-film-caption">
        <span>{title}</span>
        {failed && (
          <>
            <span className="v2-small" role="status">
              这一幕暂时没播起来，可以先动手画。
            </span>
            <button
              onClick={() => {
                setFailed(false);
                setPlaying(true);
              }}
            >
              再播一次
            </button>
          </>
        )}
        {c && !playing && !failed && (
          <button onClick={() => setPlaying(true)}>
            <Play weight="fill" />
            看这一幕 · {c.seconds}秒
          </button>
        )}
        {playing && (
          <button
            onClick={() => {
              v.current?.pause();
              setPlaying(false);
            }}
          >
            <Pause />
            停下，开始动手
          </button>
        )}
      </div>
    </div>
  );
}
function Bridge({ s, update, onClose }) {
  const [held, setHeld] = useState("deck"),
    [tried, setTried] = useState(false),
    b = s.river.bridge;
  const set = (patch) => {
    update((n) => arrangeBridge(n, patch));
    setTried(false);
  };
  const place = (zone) => set({ [zone]: true });
  return (
    <div className="v2-bridge">
      <header>
        <div>
          <span className="v2-kicker">给人留条路</span>
          <h3>拼好小桥，请小禾走一走</h3>
        </div>
        <button onClick={onClose} aria-label="收起拼桥">
          <X />
        </button>
      </header>
      <p>两头有支撑，桥面横着放。可以拖，也可以先选一块，再点空位。</p>
      <div className="v2-bridge-board">
        <span className="v2-water-band" />
        {["left", "deck", "right"].map((id, i) => (
          <button
            key={id}
            className={
              "v2-bridge-slot " +
              id +
              (b[id] ? " filled" : "") +
              (id === "deck" && !b.horizontal ? " vertical" : "")
            }
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const p = e.dataTransfer.getData("text/x-bridge");
              if (p === id) place(id);
            }}
            onClick={() => {
              if (held === id) place(id);
            }}
            aria-label={"放" + ["左支架", "桥面", "右支架"][i]}
          >
            {b[id]
              ? ["左支架", "桥面", "右支架"][i]
              : ["放左支架", "放桥面", "放右支架"][i]}
          </button>
        ))}
        {b.tested && (
          <img
            className={"v2-bridge-walker " + (s.quiet ? "quiet" : "")}
            src={A + "xiaohe-guide-v1.png"}
            alt="小禾沿小桥走到了另一边"
          />
        )}
      </div>
      <div className="v2-actions">
        {[
          ["left", "左支架"],
          ["deck", "桥面"],
          ["right", "右支架"],
        ].map(([id, label]) => (
          <button
            draggable
            key={id}
            aria-pressed={held === id}
            onDragStart={(e) => e.dataTransfer.setData("text/x-bridge", id)}
            onClick={() => setHeld(id)}
          >
            {label}
          </button>
        ))}
        <button onClick={() => set({ horizontal: !b.horizontal })}>
          <ArrowClockwise />
          转一转桥面
        </button>
        <button
          className="v2-primary"
          onClick={() => {
            update(testBridge);
            setTried(true);
          }}
        >
          请小禾试走
        </button>
      </div>
      {tried && (
        <p className={"v2-feedback " + (b.tested ? "good" : "")} role="status">
          {b.tested
            ? "小禾走过去了！现在回到水路，再试一次。"
            : !b.left || !b.right
              ? "桥头还有一处没托住，先补上支架。"
              : !b.deck
                ? "桥面还没放好。"
                : "桥面转错方向了。横过来，才能接住两边。"}
        </p>
      )}
    </div>
  );
}
function Offer({ s, update, onNext }) {
  const o = s.offer,
    [selected, setSelected] = useState(null);
  const needs = [
      ["field", "田里缺水"],
      ["door", "门前要走人"],
      ["tomorrow", "马良明天不在"],
    ],
    ways = [
      ["teach", "把做法教给接手的人"],
      ["share", "大家轮流取水"],
      ["path", "留一条能走的路"],
    ];
  return (
    <>
      <div className="v2-story-line">
        <span>大官</span>
        <p>“神笔以后听我安排，粮食今天就分。”</p>
      </div>
      <div className="v2-contract">
        <h3>卷轴下面，还写着什么？</h3>
        <p className="v2-contract-first">今日分粮，共修水车。</p>
        {o.read ? (
          <p className="v2-contract-rule">
            神笔听我安排。往后用这架水车，得先在约定上签字。
          </p>
        ) : (
          <button
            className="v2-primary"
            onClick={() =>
              update((n) => ({ ...n, offer: { ...n.offer, read: true } }))
            }
          >
            展开卷轴下面的话
          </button>
        )}
      </div>
      {o.read && (
        <div className="v2-choices">
          {[
            ["accept", "先领粮，再想办法", "粮食能救急，签字的条件也会留下。"],
            [
              "refuse",
              "笔留下，另想办法",
              "请大家一起想办法，不答应这条限制。",
            ],
            ["talk", "先把话问清楚", "把大家的需要和办法摆出来，再商量。"],
          ].map(([id, t, d]) => (
            <button
              key={id}
              aria-pressed={o.choice === id}
              onClick={() => update((n) => setOffer(n, id))}
            >
              <strong>{t}</strong>
              <span>{d}</span>
            </button>
          ))}
        </div>
      )}
      {o.choice === "talk" && (
        <section className="v2-match">
          <h3>把需要和办法接起来</h3>
          {o.exclusive && (
            <p>领粮时答应的条件还在。请大家重新说好，才算改过来。</p>
          )}
          <p>先点一句需要，再点一个办法；也可以把需要拖过去。</p>
          <div className="v2-match-columns">
            <div>
              {needs.map(([id, label]) => (
                <button
                  key={id}
                  draggable
                  aria-pressed={selected === id}
                  onClick={() => setSelected(id)}
                  onDragStart={(e) => e.dataTransfer.setData("text/x-need", id)}
                >
                  {label}
                  {o.links[id] && (
                    <small>
                      → {ways.find(([k]) => k === o.links[id])?.[1]}
                    </small>
                  )}
                </button>
              ))}
            </div>
            <div>
              {ways.map(([id, label]) => (
                <button
                  key={id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const k = e.dataTransfer.getData("text/x-need");
                    if (needs.some(([n]) => n === k))
                      update((n) => ({
                        ...n,
                        offer: {
                          ...n.offer,
                          links: { ...n.offer.links, [k]: id },
                          agreed: false,
                        },
                      }));
                  }}
                  onClick={() => {
                    if (selected) {
                      update((n) => ({
                        ...n,
                        offer: {
                          ...n.offer,
                          links: { ...n.offer.links, [selected]: id },
                          agreed: false,
                        },
                      }));
                      setSelected(null);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="v2-match-check" role="status">
            {o.agreed
              ? "大家说好了：不用另外签字，按商量好的次序取水。"
              : agreementReady(o)
                ? "三件事都有了对应的办法。还要请大家一起说好。"
                : Object.keys(o.links).length === 3
                  ? "有一句还没接上它要解决的事。再读读左右两边。"
                  : "接好一句，就看看它解决了哪件事。"}
          </p>
          <button
            className="v2-primary"
            disabled={!agreementReady(o) || o.agreed}
            onClick={() => update(confirmAgreement)}
          >
            请大家一起说好
          </button>
        </section>
      )}
      {o.choice && (
        <div className="v2-next">
          <p>
            {o.choice === "accept"
              ? "小禾：“粮袋留下了，神笔以后却得听他安排。想改约定，还要请大家重新商量。”"
              : o.choice === "refuse" && o.exclusive
                ? "小禾：“领粮时答应的条件还在。得重新商量，不能只把选择换掉。”"
                : o.choice === "refuse"
                  ? "鲁伯：“笔先留下。粮食的难处，我们一起再想办法。”"
                  : o.agreed
                    ? "小禾：“说好的事，还要让下一位知道怎么做。”"
                    : "小禾：“话还没谈完。你也可以先把问题留下。”"}
          </p>
          <button className="v2-primary" onClick={onNext}>
            看看明天谁来接手
            <ArrowRight />
          </button>
        </div>
      )}
    </>
  );
}
export default function AppV2({ onMap, onReport, onStateChange }) {
  const [s, setS] = useState(() => {
      try {
        return restore(localStorage.getItem(KEY)) || fresh();
      } catch {
        return fresh();
      }
    }),
    [modal, setModal] = useState(null),
    [clips, setClips] = useState({}),
    [bridgeOpen, setBridgeOpen] = useState(false),
    [showHint, setShowHint] = useState(false),
    [guide, setGuide] = useState(""),
    [ai, setAI] = useState(false),
    [busy, setBusy] = useState(false),
    [storage, setStorage] = useState(true),
    [audioNote, setAudioNote] = useState(""),
    [systemQuiet, setSystemQuiet] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [seen, setSeen] = useState(""),
    heading = useRef(null),
    requestId = useRef(0);
  const quiet = s.quiet || systemQuiet;
  const update = (fn) => setS((n) => (typeof fn === "function" ? fn(n) : fn)),
    next = (chapter) => update((n) => go(n, chapter));
  useEffect(() => {
    onStateChange?.(s);
  }, [s, onStateChange]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      setStorage(true);
    } catch {
      setStorage(false);
    }
  }, [s]);
  useEffect(() => {
    requestId.current++;
    setBusy(false);
    window.speechSynthesis?.cancel();
    heading.current?.focus();
    window.scrollTo(0, 0);
    setShowHint(false);
    setGuide("");
    setBridgeOpen(false);
  }, [s.chapter]);
  useEffect(() => {
    fetch("/video/v2-manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setClips(d.clips || {}))
      .catch(() => {});
    fetch("/api/capabilities")
      .then((r) => r.json())
      .then((d) => setAI(!!d.guide))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setSystemQuiet(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => () => window.speechSynthesis?.cancel(), [modal]);
  const ask = async () => {
    const ticket = ++requestId.current;
    setShowHint((v) => !v);
    setGuide(HINT[s.chapter]);
    if (!ai || busy || !["river", "handoff", "ending"].includes(s.chapter))
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: { river: "workshop", handoff: "handoff", ending: "ending" }[
            s.chapter
          ],
          waterReady: !!s.river.result?.ok,
          handoffReady: s.handoff.done,
          exclusive: s.offer.exclusive,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        if (ticket === requestId.current && typeof d.text === "string")
          setGuide(d.text);
      }
    } catch {
    } finally {
      if (ticket === requestId.current) setBusy(false);
    }
  };
  const step = CHAPTERS.findIndex(([id]) => id === s.chapter),
    isHome = s.chapter === "home",
    id = ending(s);
  return (
    <div
      className={"v2 " + (quiet ? "v2-quiet" : "") + (isHome ? " v2-home" : "")}
    >
      <header className="v2-header">
        <button
          className="v2-brand"
          onClick={() => update((n) => ({ ...n, chapter: "home" }))}
        >
          奇幻一笔<span>神笔马良</span>
        </button>
        {!isHome && (
          <nav aria-label="故事走到哪里">
            {CHAPTERS.map(([k, label], i) => (
              <button
                key={k}
                disabled={!s.visited.includes(k)}
                aria-current={s.chapter === k ? "step" : undefined}
                onClick={() => next(k)}
                title={label}
                aria-label={label}
              >
                <span>{i + 1}</span>
                <b>{label}</b>
              </button>
            ))}
          </nav>
        )}
        <div>
          <FullscreenButton/>
          <button aria-label="我的画册" onClick={() => setModal("album")}>
            <BookOpen />
            <span>我的画册</span>
          </button>
          <button aria-label="教师" onClick={() => setModal("teacher")}>
            <Users />
            <span>教师</span>
          </button>
          <button
            aria-label="阅读与声音设置"
            onClick={() => setModal("settings")}
          >
            <Gear />
          </button>
        </div>
      </header>
      {onMap && (
        <div className="w3-water-links">
          <strong>一笔清泉</strong>
          <button onClick={onMap}>返回故事画卷</button>
          <button onClick={onReport}>我的成长画卷</button>
        </div>
      )}
      {!storage && (
        <p className="v2-save-warning" role="alert">
          这台设备没能保存新笔迹。先打开画册下载，别急着关页面。
        </p>
      )}
      {isHome ? (
        <main className="v2-cover">
          <img
            src={A + "hero-scroll-v1.png"}
            alt="马良和小禾站在河边，远处青山环绕村庄"
          />
          <div className="v2-cover-action">
            <span className="v2-kicker">一笔清泉 · 把水引到田里</span>
            <h1>画一条水路，把办法留下。</h1>
            <p>画出的东西好不好用？让雨滴、小禾和村里人来试一试。</p>
            <button
              className="v2-primary"
              onClick={() => next(s.resume || s.visited.at(-1) || "brush")}
            >
              <PaintBrush />
              {s.visited.length ? "接着我的画卷" : "拿起神笔，开始画"}
              <ArrowRight />
            </button>
            {s.visited.length > 0 && (
              <button
                className="v2-restart-link"
                onClick={() => setModal("restart")}
              >
                另起一张画卷
              </button>
            )}
          </div>
        </main>
      ) : (
        <main className={"v2-main " + s.chapter}>
          <div className="v2-chapter-title">
            <span className="v2-kicker">
              第{["一", "二", "三", "四", "五"][step]}幕 ·{" "}
              {["画出来", "试试看", "想一想", "传下去", "再添一笔"][step]}
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {TITLE[s.chapter]}
            </h1>
          </div>
          {s.chapter === "brush" && (
            <>
              <aside className="v2-context">
                <SceneFilm
                  id="night"
                  poster="night-brush-v2.png"
                  clips={clips}
                  quiet={quiet}
                  title="雨落进小屋，桌上的笔忽然亮了。"
                />
                <p className="v2-context-voice">
                  马良把画纸往怀里一收：
                  <br />
                  “要是有一把伞，就好了。”
                </p>
                <p className="v2-context-cue">现在，换你来画。</p>
              </aside>
              <section className="v2-workbench">
                <div className="v2-task-title">
                  <h2>给画纸画一把伞</h2>
                  <p>
                    先画宽宽的伞面，再添伞柄和喜欢的花纹。试试能不能挡住雨。
                  </p>
                </div>
                <PaintBoard
                  kind="canopy"
                  strokes={s.canopy.strokes}
                  result={s.canopy.result}
                  quiet={quiet}
                  onChange={(v) => update((n) => draw(n, "canopy", v))}
                  onTest={() => update((n) => testDrawing(n, "canopy"))}
                />
                {s.canopy.result && (
                  <div
                    className={
                      "v2-feedback " + (s.canopy.result.ok ? "good" : "")
                    }
                    role="status"
                  >
                    <Check />
                    <p>{s.canopy.result.message}</p>
                  </div>
                )}
                {s.canopy.tests.length > 0 && (
                  <div className="v2-next">
                    <p>
                      {s.canopy.result?.ok
                        ? "马良：“这把伞，真的派上用场了！”"
                        : "小禾：“画还可以接着改。也可以先带着它去河边看看。”"}
                    </p>
                    <button
                      className="v2-primary"
                      onClick={() => next("river")}
                    >
                      带着神笔，去河边
                      <ArrowRight />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          {s.chapter === "river" && (
            <>
              <aside className="v2-context">
                <SceneFilm
                  id="river"
                  poster="river-survey-v1.png"
                  clips={clips}
                  quiet={quiet}
                  title="河里有水，田比河高。门前还有人来往。"
                />
                <div className="v2-listen">
                  <span>先听一句</span>
                  {[
                    ["小禾", "田里的苗渴了，水能送上去吗？"],
                    ["周婶", "门口是大家每天走的路，别挡住呀。"],
                    ["鲁伯", "我来把水提到高处。你给它画一条路。"],
                  ].map(([person, text]) => (
                    <button
                      key={person}
                      aria-pressed={seen === person}
                      onClick={() => setSeen(seen === person ? "" : person)}
                    >
                      {person}
                      {seen === person && <span>{text}</span>}
                    </button>
                  ))}
                </div>
              </aside>
              <section className="v2-workbench">
                <div className="v2-task-title">
                  <h2>从出水口，画到右上角的田边</h2>
                  <p>每一条线都是水路。你可以绕过门口，也可以留下一座桥。</p>
                </div>
                <div className="v2-preparation">
                  <label>
                    <input
                      type="checkbox"
                      checked={s.river.support}
                      onChange={(e) => {
                        const support = e.target.checked;
                        update((n) => prepareRiver(n, { support }));
                      }}
                    />
                    请鲁伯装稳支架
                  </label>
                  <fieldset>
                    <legend>谁来提水？</legend>
                    {[
                      ["wheel", "水流推动轮子"],
                      ["people", "请大人轮换"],
                    ].map(([power, text]) => (
                      <label key={power}>
                        <input
                          type="radio"
                          name="v2-power"
                          checked={s.river.power === power}
                          onChange={() =>
                            update((n) => prepareRiver(n, { power }))
                          }
                        />
                        {text}
                      </label>
                    ))}
                  </fieldset>
                </div>
                <PaintBoard
                  key="river"
                  kind="river"
                  strokes={s.river.strokes}
                  result={s.river.result}
                  quiet={quiet}
                  bridge={s.river.bridge}
                  onChange={(v) => update((n) => draw(n, "river", v))}
                  onTest={() => update((n) => testDrawing(n, "river"))}
                />
                <RiverView river={s.river} quiet={quiet}/>
                {s.river.needsRetest && (
                  <p className="v2-feedback" role="status">
                    这张图还有一条支路。请再试一次，看看水会不会流到门前。
                  </p>
                )}
                {s.river.result && (
                  <div
                    className={
                      "v2-feedback " + (s.river.result.ok ? "good" : "")
                    }
                    role="status"
                  >
                    <Drop />
                    <p>{s.river.result.message}</p>
                    {s.river.result.blocked && (
                      <button onClick={() => setBridgeOpen(true)}>
                        给门口拼座小桥
                      </button>
                    )}
                  </div>
                )}
                {bridgeOpen && (
                  <Bridge
                    s={s}
                    update={update}
                    onClose={() => setBridgeOpen(false)}
                  />
                )}
                <div className="v2-next">
                  <button onClick={() => setBridgeOpen((v) => !v)}>
                    看看门前的小桥
                  </button>
                  {s.river.tests.length > 0 && (
                    <button
                      className="v2-primary"
                      onClick={() => next("offer")}
                    >
                      {s.river.result?.ok
                        ? "收好水路图，听听来人说什么"
                        : "带着问题，听听来人说什么"}
                      <ArrowRight />
                    </button>
                  )}
                </div>
              </section>
            </>
          )}
          {s.chapter === "offer" && (
            <>
              <SceneFilm
                id="offer"
                poster="grain-contract-v1.png"
                clips={clips}
                quiet={quiet}
                title="大官带来粮袋，也想管住神笔。"
              />
              <Offer s={s} update={update} onNext={() => next("handoff")} />
            </>
          )}
          {s.chapter === "handoff" && (
            <>
              <div className="v2-handoff-scene">
                <img
                  src={A + "shared-board-v1.png"}
                  alt="大家围着木牌和画笔，商量怎样接着做"
                />
              </div>
              <Handoff
                s={s}
                update={update}
                onNext={() => update(finish)}
                onRiver={() => next("river")}
                quiet={quiet}
              />
            </>
          )}
          {s.chapter === "ending" && (
            <section className="v2-ending">
              <img
                className="v2-ending-art"
                src={
                  A +
                  (id === "E3"
                    ? "ending-conditions-v1.png"
                    : id === "E1"
                      ? "shared-board-v1.png"
                      : "evening-review-v1.png")
                }
                alt="画卷里的伙伴正在看这一回留下的办法"
              />
              <div className="v2-ending-copy">
                <span className="v2-kicker">
                  《一笔清泉》 ·{" "}
                  {id === "E1" || id === "E2" ? "本章落幕" : "这一回先停在这里"}
                </span>
                <h2>{ENDINGS[id][0]}</h2>
                <p>{ENDINGS[id][1]}</p>
              </div>
              <section className="w3-water-coda">
                <span className="w3-seal">
                  {id === "E1" || id === "E2" ? "成" : "续"}
                </span>
                <h3>第二天，村里发生了什么？</h3>
                <p>
                  {s.river.result?.ok
                    ? "晨光落在田埂上。细细的水流顺着你画的路到了田边，门前仍能走人。鲁伯弯下腰，摸了摸湿润的泥土。"
                    : "天亮了，鲁伯拿着画来到田边。水路还有一处没试好，他把问题指给你看，等你再来添一笔。"}
                </p>
                <p>
                  {s.offer.exclusive
                    ? "周婶停在木牌前：“粮食有了，可往后取水，还是要先签字。这条条件，还得一起说清楚。”"
                    : s.handoff.done
                      ? "小禾照着留下的做法，和大人一起提水、停水、收好工具：“明天换个人，也知道该怎么做了！”"
                      : "小禾拿着图说：“你在时我看明白了，可你不在的时候，我还想再试一遍。请把办法教给我吧。”"}
                </p>
                <p>
                  <strong>
                    {id === "E1" || id === "E2"
                      ? "这一章结束了。你的画和教给大家的办法，都留在村里。"
                      : "这一回的发现已经留下。带着下面的问题回来，故事还可以有新的结尾。"}
                  </strong>
                </p>
              </section>
              <div className="v2-created">
                <figure>
                  <Artwork strokes={s.canopy.strokes} kind="canopy" />
                  <figcaption>我画的伞</figcaption>
                </figure>
                <figure>
                  <Artwork strokes={s.river.strokes} kind="river" />
                  <figcaption>我画的水路</figcaption>
                </figure>
              </div>
              <div className="v2-ending-facts">
                <p>
                  {s.river.result?.ok
                    ? "水到了，门前也能走。"
                    : "水路或门前的路，还要试好。"}
                  <button onClick={() => next("river")}>回去添一笔</button>
                </p>
                <p>
                  {s.offer.exclusive
                    ? "签了才准用水的条件还在。"
                    : "没有签字取水的限制。"}
                  <button onClick={() => next("offer")}>再去谈一谈</button>
                </p>
                <p>
                  {s.handoff.done ? "接手的人已照图试完。" : "交接还没有试完。"}
                  <button onClick={() => next("handoff")}>再请小禾试试</button>
                </p>
              </div>
              <label className="v2-own-words">
                我最想说的一件事
                <textarea
                  value={s.note}
                  maxLength={400}
                  onChange={(e) => {
                    const note = e.target.value;
                    update((n) => ({ ...n, note }));
                  }}
                  placeholder="可以写下发现，也可以说给身边的伙伴听。"
                />
              </label>
              {onReport && (
                <div className="w3-water-finish">
                  <button className="v2-primary" onClick={onReport}>
                    <BookOpen />
                    看看我的学习反馈
                  </button>
                  <button onClick={onMap}>收好这一章，回到画卷</button>
                </div>
              )}
              <button className="v2-primary" onClick={() => setModal("album")}>
                <BookOpen />
                把我的画带走
              </button>
            </section>
          )}
        </main>
      )}
      {!isHome && (
        <aside className="v2-companion">
          {showHint && (
            <div className="v2-companion-talk" role="status">
              <strong>小禾陪你想</strong>
              <p>{guide || HINT[s.chapter]}</p>
              <button onClick={() => setShowHint(false)}>我来试试</button>
            </div>
          )}
          <button
            className="v2-companion-person"
            onClick={ask}
            aria-label="请小禾帮我想一想"
          >
            <img src={A + "xiaohe-guide-v1.png"} alt="小禾" />
            <span>{busy ? "小禾想一想……" : "小禾陪你画"}</span>
          </button>
        </aside>
      )}
      {modal === "restart" && (
        <Dialog title="开始一张新画卷" onClose={() => setModal(null)}>
          <p>先把这一回的画收好吧。开始以后，画纸和故事会从头展开。</p>
          <div className="v2-actions">
            <button onClick={() => saveFile("我的奇幻一笔.html", albumHtml(s))}>
              <Download />
              先保存这一回
            </button>
            <button
              className="v2-primary"
              onClick={() => {
                update({ ...fresh(), quiet: s.quiet });
                setModal(null);
              }}
            >
              我收好了，开始新画卷
            </button>
            <button onClick={() => setModal(null)}>还是接着画</button>
          </div>
        </Dialog>
      )}
      {modal === "album" && (
        <Dialog title="我的画册" onClose={() => setModal(null)} wide>
          <p>每一张都是你的笔迹。没试好的画，也值得留下来。</p>
          <Journal
            s={s}
            initialKind={
              s.chapter === "brush" || s.chapter === "home" ? "canopy" : "river"
            }
            saveFile={saveFile}
          />
          <button
            className="v2-primary"
            onClick={() => saveFile("我的奇幻一笔.html", albumHtml(s))}
          >
            <Download />
            把画和故事一起保存
          </button>
        </Dialog>
      )}
      {modal === "teacher" && (
        <Dialog title="让每一笔都有后续" onClose={() => setModal(null)}>
          <p>
            小学四至六年级。主线按“画—试—改—商量—交接”展开，建议分两课体验与交流。
          </p>
          <h3>观察学生怎样解决具体问题</h3>
          <p>
            伞面漏雨时，孩子改了哪里？水到田边以后，有没有看看门前？别人接手时，哪一句说明还不清楚？不按画得像不像、重试次数或先帮助谁评分。
          </p>
          <h3>一张画，接着讲</h3>
          <p>
            请学生从画册挑一张实际试过的画，指着笔迹说：“我先画了……，试过以后发现……，所以我又……”也可以保留没想明白的问题。
          </p>
          <h3>操作与作品</h3>
          <p>
            自由画可用鼠标或触屏；连点画也支持方向键移动笔尖、回车落笔、Escape提笔。拖放均有点选或前后按钮。作品留在本机浏览器，可导出带全部笔迹的画册。
          </p>
          <h3>故事与科学</h3>
          <p>
            这是借用洪汛涛《神笔马良》主题创编的童话。纸上规则用于观察连接和后果，不模拟真实流速、桥梁承重或防雨材料。可将画出的办法带到课堂继续讨论。
          </p>
          <a href="/teacher-guide-v2.html" target="_blank" rel="noreferrer">
            打开可打印的课堂指南
          </a>
          <a href="?edition=archive">翻看以前版本的作品与拓展材料</a>
        </Dialog>
      )}
      {modal === "settings" && (
        <Dialog title="把画卷读得舒服些" onClose={() => setModal(null)}>
          <label className="v2-setting">
            <input
              type="checkbox"
              checked={s.quiet}
              onChange={(e) => {
                const quiet = e.target.checked;
                update((n) => ({ ...n, quiet }));
              }}
            />
            让画面安静一些
          </label>
          <p>雨滴和试走会直接显示结果；视频由你按播放。</p>
          <button
            onClick={() => {
              const text =
                HINT[s.chapter] || "拿起神笔，画一笔，再看看会发生什么。";
              if ("speechSynthesis" in window) {
                setAudioNote("正在读当前提示。");
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = "zh-CN";
                u.rate = 0.85;
                u.onend = () => setAudioNote("读完了，动手试试吧。");
                u.onerror = () =>
                  setAudioNote("这台设备暂时读不出声音，可以看看下面的提示。");
                window.speechSynthesis.speak(u);
              } else
                setAudioNote("这台设备暂时读不出声音，可以看看下面的提示。");
            }}
          >
            <SpeakerHigh />
            听听当前提示
          </button>
          <p role="status">{audioNote}</p>
          <p>{HINT[s.chapter] || "拿起神笔，画一笔，再看看会发生什么。"}</p>
          <p className="v2-small">
            所有笔迹保存在当前设备。关闭前可以打开画册，把作品下载带走。
          </p>
        </Dialog>
      )}
    </div>
  );
}

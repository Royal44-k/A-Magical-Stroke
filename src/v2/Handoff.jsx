import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  Basket,
  Eye,
} from "@phosphor-icons/react";
import { Ink } from "./PaintBoard.jsx";
import {
  STEPS,
  TOOLS,
  arrange,
  handoffStep,
  handoffAction,
  setHandoffPerson,
  freshPractice,
  riverResult,
  flowFrame,
  handoffRecord,
} from "./engine.mjs";

function ToolShape({ id }) {
  return (
    <svg viewBox="0 0 80 70" aria-hidden="true" className="v22-tool-icon">
      {id === "bucket" ? (
        <>
          <path
            d="M20 25Q20 1 40 4Q60 1 60 25"
            fill="none"
            stroke="#796342"
            strokeWidth="4"
          />
          <path
            d="M15 25H65L59 63H21Z"
            fill="#cfac70"
            stroke="#795e3d"
            strokeWidth="3"
          />
          <path
            d="M27 30L30 58M40 30V58M53 30L50 58"
            stroke="#a07e4b"
            strokeWidth="3"
          />
        </>
      ) : id === "rope" ? (
        <>
          <ellipse
            cx="40"
            cy="32"
            rx="26"
            ry="21"
            fill="none"
            stroke="#b79051"
            strokeWidth="7"
          />
          <ellipse
            cx="40"
            cy="32"
            rx="14"
            ry="10"
            fill="none"
            stroke="#8d6f3c"
            strokeWidth="5"
          />
          <path
            d="M60 47Q74 65 48 63"
            fill="none"
            stroke="#b79051"
            strokeWidth="6"
          />
        </>
      ) : (
        <>
          <path
            d="M13 48L59 8L71 22L25 62Z"
            fill="#e0bd79"
            stroke="#927449"
            strokeWidth="2"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${24 + i * 8} ${45 - i * 7}l7 8`}
              stroke="#755c35"
              strokeWidth="2"
            />
          ))}
        </>
      )}
    </svg>
  );
}
function Practice({ s, update, quiet, onRiver }) {
  const h = s.handoff,
    p = h.practice || freshPractice(),
    [walk, setWalk] = useState(p.arrived ? 100 : 0),
    [held, setHeld] = useState(""),
    latest = useRef(update),
    board = useRef(null),
    mounted = useRef(false);
  latest.current = update;
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const target =
      board.current?.querySelector("button:not([disabled])") ||
      board.current?.querySelector("h3");
    target?.focus({ preventScroll: true });
  }, [h.step, p.active]);
  const act = (a, v) => update((n) => handoffAction(n, a, v));
  useEffect(() => {
    if (!p.running) {
      setWalk(p.arrived ? 100 : 0);
      return;
    }
    if (p.arrived) {
      setWalk(100);
      return;
    }
    if (quiet) {
      setWalk(100);
      latest.current((n) => handoffAction(n, "arrive"));
      return;
    }
    let start, frame;
    const advance = (t) => {
      start ??= t;
      const v = Math.min(100, (t - start) / 35);
      setWalk(v);
      if (v < 100) frame = requestAnimationFrame(advance);
      else latest.current((n) => handoffAction(n, "arrive"));
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [p.running, p.arrived, quiet]);
  const result = useMemo(() => riverResult(s.river), [s.river]),
    water = flowFrame(result, walk / 100),
    step = STEPS[h.step]?.[1];
  const take = (k) => {
    act("pack", k);
    setHeld("");
  };
  return (
    <section
      className={"v22-practice " + (quiet ? "quiet" : "")}
      ref={board}
      aria-label="小禾照图试做"
    >
      <header>
        <div>
          <span className="v2-kicker">把画里的办法传下去</span>
          <h3 tabIndex={-1}>{h.done ? "下一双手，接住了" : step}</h3>
        </div>
        <span className="v22-step-mark">
          {h.done ? "试做好了" : `第${h.step + 1}件事`}
        </span>
      </header>
      <div className="v22-trial-map">
        <svg
          viewBox="0 0 800 480"
          role="img"
          aria-label={
            "小禾照着我画的水路试做，" +
            (p.arrived ? "田边已到水" : p.running ? "水正在走" : "水车停着")
          }
        >
          <rect width="800" height="480" fill="#f7f3e7" />
          <path d="M0 275Q65 250 106 320L106 480H0Z" fill="#bfddd6" />
          <rect
            x="675"
            y="70"
            width="100"
            height="110"
            rx="12"
            fill={p.arrived ? "#c1d586" : "#e4d6ae"}
          />
          <text x="725" y="52" textAnchor="middle">
            田边
          </text>
          <rect
            x="330"
            y="205"
            width="150"
            height="130"
            rx="12"
            fill="#e9d8b8"
          />
          <text x="405" y="190" textAnchor="middle">
            门前的路
          </text>
          <Ink strokes={s.river.strokes} />
          {(p.running || p.arrived) && (
            <g className="v22-water" opacity={p.running ? 1 : 0.55}>
              <path
                d={water.d}
                fill="none"
                stroke="#6bc3c7"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {p.running &&
                water.heads.map((dot, i) => (
                  <circle
                    key={i}
                    cx={dot[0]}
                    cy={dot[1]}
                    r="6"
                    fill="#f4fff5"
                    stroke="#388a94"
                    strokeWidth="2"
                  />
                ))}
            </g>
          )}
          {s.river.bridge.tested && (
            <g transform="translate(375 242)">
              <rect
                width="68"
                height="45"
                rx="5"
                fill="#c79c60"
                stroke="#795833"
                strokeWidth="3"
              />
              <path
                d="M10 3V42M23 3V42M36 3V42M49 3V42"
                stroke="#9c753f"
                strokeWidth="2"
              />
            </g>
          )}
          <g transform="translate(80 340)">
            <path
              d="M-39 62L0 0L39 62"
              fill="none"
              stroke={s.river.support ? "#92744b" : "#bb5c3e"}
              strokeWidth="8"
            />
            <g className={p.running ? "v22-wheel spinning" : "v22-wheel"}>
              <circle r="41" fill="#e5cc94" stroke="#89643d" strokeWidth="6" />
              {[0, 45, 90, 135].map((a) => (
                <path
                  key={a}
                  transform={`rotate(${a})`}
                  d="M-36 0H36"
                  stroke="#89643d"
                  strokeWidth="5"
                />
              ))}
              <circle r="8" fill="#527e72" />
            </g>
          </g>
          <text x="80" y="436" textAnchor="middle">
            {p.running ? "水车在转" : "水车停着"}
          </text>
          {p.arrived && (
            <g stroke="#557e35" strokeWidth="4" fill="none">
              <path d="M700 150V118m0 18q-16-3-16-15q16-1 16 15m0-3q15-2 15-15M748 150V118m0 18q-15-3-15-15q15-1 15 15m0-3q15-2 15-15" />
            </g>
          )}
          {h.step === 0 &&
            p.checked.map((k) => {
              const [x, y] = {
                support: [145, 395],
                route: [570, 415],
                door: [505, 300],
              }[k];
              const ok = { support:s.river.support, route:!!result.arrived, door:!result.blocked }[k];
              return (
                <g key={k} transform={`translate(${x} ${y})`}>
                  <circle r="14" fill={ok ? "#347d6b" : "#ad583d"} />
                  <path
                    d={ok ? "M-6 0l4 4l8-9" : "M-5-5L5 5M5-5L-5 5"}
                    fill="none"
                    stroke="#fff9e8"
                    strokeWidth="3"
                  />
                </g>
              );
            })}
        </svg>
        <span className="v22-map-caption">沿用你亲手画的水路</span>
      </div>
      <p className="v22-observation" role="status">
        {h.message || "“我准备好了。先从第一张做起。”"}
      </p>
      {h.done ? (
        <p className="v22-done-record">{handoffRecord(s)}</p>
      ) : p.active ? (
        <div className="v22-task-actions">
          {h.step === 0 && (
            <>
              <div className="v22-inspect">
                {[
                  ["support", "看看支架"],
                  ["route", "看看水路"],
                  ["door", "看看门前"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={p.checked.includes(id)}
                    onClick={() => act("inspect", id)}
                  >
                    <Eye />
                    {label}
                  </button>
                ))}
              </div>
              {p.checked.length === 3 && !s.river.result?.ok && (
                <button className="v2-primary" onClick={onRiver}>
                  回到水边改一改
                  <ArrowRight />
                </button>
              )}
            </>
          )}
          {h.step === 1 && (
            <button className="v2-primary" onClick={() => act("start")}>
              <Play />
              请大人开始提水
            </button>
          )}
          {h.step === 2 && (
            <button className="v2-primary" onClick={() => act("stop")}>
              请大人停下水车
            </button>
          )}
          {h.step === 3 && (
            <>
              <p className="v22-tool-hint">
                拖进篮子，也可以先选一件，再点工具篮。
              </p>
              <div className="v22-tool-table">
                <div className="v22-loose-tools">
                  {TOOLS.map(([id, name]) => (
                    <button
                      key={id}
                      draggable={!p.packed.includes(id)}
                      disabled={p.packed.includes(id)}
                      aria-label={"拿起" + name}
                      aria-pressed={held === id}
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/x-maliang-tool", id)
                      }
                      onClick={() => setHeld(id)}
                    >
                      <ToolShape id={id} />
                      <span>
                        {p.packed.includes(id) ? name + "已收好" : name}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  className="v22-basket"
                  aria-label="放进工具篮"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    take(e.dataTransfer.getData("text/x-maliang-tool"));
                  }}
                  onClick={() => {
                    if (held) take(held);
                  }}
                >
                  <Basket weight="duotone" />
                  <strong>工具篮</strong>
                  <span>
                    {held
                      ? "放入" + TOOLS.find(([id]) => id === held)[1]
                      : `收好 ${p.packed.length} / 3 件`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          className="v2-primary v22-next-card"
          onClick={() => update(handoffStep)}
        >
          {h.step ? "照着下一张做" : "请小禾开始试"}
          <ArrowRight />
        </button>
      )}
    </section>
  );
}
export default function Handoff({ s, update, onNext, onRiver, quiet }) {
  const h = s.handoff,
    [pick, setPick] = useState(0),
    [planOpen, setPlanOpen] = useState(!h.done),
    p = h.practice || freshPractice();
  useEffect(() => {
    if (p.active || h.step > 0) setPlanOpen(false);
  }, [p.active, h.step]);
  const move = (from, to) => {
    if (!Number.isInteger(from) || from < 0 || from > 3 || to < 0 || to > 3)
      return;
    const order = [...h.order],
      [item] = order.splice(from, 1);
    order.splice(to, 0, item);
    update((n) => arrange(n, order));
    setPick(to);
  };
  return (
    <section className="v2-handoff">
      <div className="v2-story-line">
        <span>小禾</span>
        <p>“把做法教给我。明天换个人，也能接着用。”</p>
      </div>
      <div className="v2-people">
        {[
          ["lead", "平时谁带头？"],
          ["backup", "他有事时，谁接手？"],
        ].map(([k, label]) => (
          <label key={k}>
            {label}
            <select
              value={h[k]}
              onChange={(e) =>
                update((n) => setHandoffPerson(n, k, e.target.value))
              }
            >
              <option value="">选一位大人</option>
              {["鲁伯", "周婶", "陈叔"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <details
        className="v22-plan"
        open={planOpen}
        onToggle={(e) => setPlanOpen(e.currentTarget.open)}
      >
        <summary>
          安排四张做法<span>可以拖动，也可以点“往前”“往后”</span>
        </summary>
        <div className="v2-step-cards">
          {h.order.map((id, i) => (
            <article
              key={id}
              className={
                (pick === i ? "picked " : "") + (i < h.step ? "done" : "")
              }
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("text/x-step", String(i))
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const v = e.dataTransfer.getData("text/x-step");
                if (v !== "") move(Number(v), i);
              }}
            >
              <button onClick={() => setPick(i)} aria-pressed={pick === i}>
                <span>{i < h.step ? <Check /> : i + 1}</span>
                <strong>{STEPS.find(([k]) => k === id)[1]}</strong>
              </button>
              <div>
                <button
                  disabled={i === 0}
                  aria-label={
                    "把" + STEPS.find(([k]) => k === id)[1] + "往前放"
                  }
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowLeft />
                  往前
                </button>
                <button
                  disabled={i === 3}
                  aria-label={
                    "把" + STEPS.find(([k]) => k === id)[1] + "往后放"
                  }
                  onClick={() => move(i, i + 1)}
                >
                  往后
                  <ArrowRight />
                </button>
              </div>
            </article>
          ))}
        </div>
      </details>
      <Practice s={s} update={update} quiet={quiet} onRiver={onRiver} />
      <div className="v2-next">
        <button
          onClick={() => {
            update((n) => arrange(n, n.handoff.order));
            setPlanOpen(true);
          }}
        >
          从第一张重试
        </button>
        <button className="v2-primary" onClick={onNext}>
          {h.done ? "带着画，去看看结尾" : "把这处问题留下，看看结尾"}
          <ArrowRight />
        </button>
      </div>
    </section>
  );
}

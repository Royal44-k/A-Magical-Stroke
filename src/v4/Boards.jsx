import React, { useState, useRef } from "react";
import {
  SOIL,
  SEED,
  ROCK,
  FAMILIES,
  PALETTE,
  sailShape,
  simplifyInk,
} from "./model.mjs";
import { includes, SEA_ROCK, DIR_NAMES } from "../v3/model.mjs";
import Spatial from "../spatial/Spatial.jsx";
const eq = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
function Grid({ rows, cols, onCell, children, label }) {
  const ref = useRef(),
    active = useRef(false),
    last = useRef(null);
  const hit = (e) => {
    const r = ref.current.getBoundingClientRect(),
      x = Math.floor(((e.clientX - r.left) / r.width) * cols),
      y = Math.floor(((e.clientY - r.top) / r.height) * rows);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      const k = y * cols + x;
      if (k !== last.current) {
        last.current = k;
        onCell(k, [x, y]);
      }
    }
  };
  return (
    <div
      ref={ref}
      className="q4-grid"
      style={{ "--cols": cols, "--rows": rows }}
      role="group"
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        active.current = true;
        last.current = null;
        ref.current.setPointerCapture(e.pointerId);
        hit(e);
      }}
      onPointerMove={(e) => {
        if (active.current) hit(e);
      }}
      onPointerUp={() => {
        active.current = false;
        last.current = null;
      }}
      onPointerCancel={() => {
        active.current = false;
        last.current = null;
      }}
    >
      {children}
    </div>
  );
}
export function CowBoard({ d, update, scenario }) {
  const [hint, setHint] = useState("");
  const add = (p) => {
    const previous = d.route.at(-1) || [0, 3];
    if (p[0] !== previous[0] && p[1] !== previous[1]) {
      setHint("先画到旁边的一格，不能斜着跨过去。");
      return;
    }
    setHint("");
    update((n) => {
      const prev = n.route.at(-1) || [0, 3];
      if (eq(prev, p)) return n;
      if (!n.route.length) return { ...n, route: [[0, 3]] };
      const dx = p[0] - prev[0],
        dy = p[1] - prev[1];
      if (dx && dy) return n;
      const line = [];
      for (let i = 1; i <= Math.abs(dx || dy); i++)
        line.push([prev[0] + Math.sign(dx) * i, prev[1] + Math.sign(dy) * i]);
      return { ...n, route: [...n.route, ...line].slice(0, 80) };
    });
  };
  return (
    <>
      <div className="q4-board-label">
        <span>你的路线，会变成耕牛的脚步</span>
        <b>一格田＝{scenario ? 3 : 2}平方米</b>
      </div>
      <div className="q4-field">
        <Grid
          cols={5}
          rows={4}
          label="耕田路线画纸，五列四行"
          onCell={(_, p) => add(p)}
        >
          {Array.from({ length: 20 }, (_, i) => {
            const p = [i % 5, Math.floor(i / 5)],
              kind = includes(SOIL, p)
                ? "soil"
                : includes(SEED, p)
                  ? "seed"
                  : includes(ROCK, p)
                    ? "rock"
                    : eq(p, [0, 3])
                      ? "ox"
                      : "path";
            return (
              <button
                key={i}
                className={"q4-cell " + kind}
                onClick={(e) => {
                  if (e.detail === 0) add(p);
                }}
                aria-label={`第${p[0] + 1}列第${p[1] + 1}行，${{ soil: "田", seed: "小苗", rock: "石头", ox: "耕牛出发处", path: "田埂" }[kind]}`}
              >
                <span>
                  {kind === "soil"
                    ? "田"
                    : kind === "seed"
                      ? "小苗"
                      : kind === "rock"
                        ? "石头"
                        : kind === "ox"
                          ? "牛"
                          : ""}
                </span>
              </button>
            );
          })}
        </Grid>
        <svg
          className="q4-route-ink"
          viewBox="0 0 500 400"
          aria-label="我画的耕田路线"
        >
          <polyline
            points={d.route
              .map(([x, y]) => `${x * 100 + 50},${y * 100 + 50}`)
              .join(" ")}
            fill="none"
            stroke="#f6d773"
            strokeWidth="12"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {d.route.map(([x, y], i) => (
            <circle
              key={i}
              cx={x * 100 + 50}
              cy={y * 100 + 50}
              r={i === d.route.length - 1 ? 13 : 5}
              fill={i === d.route.length - 1 ? "#fff" : "#205d50"}
            />
          ))}
        </svg>
      </div>
      <div className="q4-tools">
        <button
          disabled={d.route.length < 2}
          onClick={() => update((n) => ({ ...n, route: n.route.slice(0, -1) }))}
        >
          撤回一步
        </button>
        <button
          disabled={d.route.length < 2}
          onClick={() => update((n) => ({ ...n, route: [[0, 3]] }))}
        >
          从起点重画
        </button>
        <span role="status">
          {hint || "拖着画路线，也可以一格一格点。黄色线是你的计划。"}
        </span>
      </div>
    </>
  );
}
export function MillBoard({ d, update, scenario }) {
  const [family, setFamily] = useState(0);
  const total = scenario ? 18 : 12,
    unit = scenario ? 0.5 : 1;
  const color = (i) =>
    update((n) => {
      const a = [...n.allocation];
      a[i] = family;
      return { ...n, allocation: a };
    });
  return (
    <>
      <div className="q4-board-label">
        <span>每一格，都有要送到的人家</span>
        <b>一格＝{unit === 0.5 ? "半份" : "1份"}面粉</b>
      </div>
      <div className="q4-palette" aria-label="选一家，再涂面粉">
        {FAMILIES.map((f, i) => (
          <button
            key={f}
            aria-pressed={family === i}
            style={{ "--family": PALETTE[i] }}
            onClick={() => setFamily(i)}
          >
            <i />
            {f}
            <small>{[2, 3, 1][i]}人</small>
          </button>
        ))}
        <button aria-pressed={family === -1} onClick={() => setFamily(-1)}>
          留空
        </button>
      </div>
      <Grid
        rows={scenario ? 3 : 2}
        cols={6}
        label="分粮图"
        onCell={(i) => color(i)}
      >
        {Array.from({ length: total }, (_, i) => {
          const k = d.allocation[i];
          return (
            <button
              key={i}
              className={"q4-grain " + (k >= 0 ? "" : "is-empty")}
              style={{ "--family": PALETTE[k] || "#dcd2b8" }}
              aria-label={`第${i + 1}格，${FAMILIES[k] || "还没分"}`}
              onClick={(e) => {
                if (e.detail === 0) color(i);
              }}
            >
              <span>{k >= 0 ? ["鲁", "周", "婆"][k] : "待分"}</span>
              <small>{unit === 0.5 ? "½" : "1"}</small>
            </button>
          );
        })}
      </Grid>
      <div className="q4-baskets">
        {FAMILIES.map((f, k) => (
          <div key={f} style={{ "--family": PALETTE[k] }}>
            <strong>{f}</strong>
            <span>
              {d.allocation.slice(0, total).filter((v) => v === k).length *
                unit}
              份
            </span>
          </div>
        ))}
      </div>
      {scenario === 1 && (
        <fieldset className="q4-policy">
          <legend>先把分粮的办法说清楚</legend>
          <label>
            <input
              type="radio"
              name="policy"
              checked={d.policy === "equal"}
              onChange={() => update((n) => ({ ...n, policy: "equal" }))}
            />
            每个人一样多：9份分给6人
          </label>
          <label>
            <input
              type="radio"
              name="policy"
              checked={d.policy === "needs"}
              onChange={() => update((n) => ({ ...n, policy: "needs" }))}
            />
            先顾眼前需要：鲁伯家至少2份、周婶家至少3份、阿婆至少2份；余下的再安排
          </label>
        </fieldset>
      )}
      <p className="q4-note">
        涂过的格子可以换颜色。没有唯一的图案，份数和你说好的办法要对得上。
      </p>
    </>
  );
}
export function SailBoard({ d, update }) {
  const ref = useRef(),
    drag = useRef(null),
    pen = useRef(false),
    penTrail = useRef([]),
    [trail, setTrail] = useState([]),
    [cursor, setCursor] = useState([2, 4]),
    [hint, setHint] = useState("");
  const pt = (e) => {
    const p = ref.current.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(ref.current.getScreenCTM().inverse());
    return [
      Math.max(0, Math.min(8, Math.round((q.x - 40) / 70))),
      Math.max(0, Math.min(5, Math.round((q.y - 35) / 70))),
    ];
  };
  const rawPoint = (e) => {
    const p = ref.current.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(ref.current.getScreenCTM().inverse());
    return [
      Math.max(0, Math.min(8, (q.x - 40) / 70)),
      Math.max(0, Math.min(5, (q.y - 35) / 70)),
    ];
  };
  const add = (p) => {
    setCursor(p);
    if (d.sealed) {
      setHint("要改帆形，可以拖动顶点；也可以先“拆开最后一笔”。");
      return;
    }
    setHint("");
    update((n) => {
      if (n.polygon.length >= 30 || eq(n.polygon.at(-1), p)) return n;
      return { ...n, polygon: [...n.polygon, p] };
    });
  };
  const shape = sailShape(d.polygon, d.sealed);
  return (
    <>
      <div className="q4-board-label">
        <span>桅杆上的两个红点，都要连进帆边</span>
        <b>每小格是一块布</b>
      </div>
      <svg
        className="q4-sail-paper"
        ref={ref}
        viewBox="0 0 640 420"
        tabIndex={0}
        role="application"
        aria-label="船帆画纸；上红点在第3列第2行，下红点在第3列第5行；方向键移动，回车落笔，按钮封口"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          ref.current.focus({ preventScroll: true });
          const p = pt(e),
            i = d.sealed ? d.polygon.findIndex((v) => eq(v, p)) : -1;
          if (i >= 0) {
            drag.current = i;
            ref.current.setPointerCapture(e.pointerId);
          } else {
            pen.current = !d.sealed;
            penTrail.current = [rawPoint(e)];
            setTrail(penTrail.current);
            ref.current.setPointerCapture(e.pointerId);
            add(p);
          }
        }}
        onPointerMove={(e) => {
          if (pen.current && penTrail.current.length < 500) {
            penTrail.current = [...penTrail.current, rawPoint(e)];
            setTrail(penTrail.current);
          }
        }}
        onPointerUp={(e) => {
          if (pen.current) {
            const points = simplifyInk([...penTrail.current, rawPoint(e)]);
            update((n) => ({
              ...n,
              polygon: [...n.polygon, ...points.slice(1)].slice(0, 30),
            }));
            setTrail([]);
          }
          pen.current = false;
          if (drag.current !== null) {
            const p = pt(e),
              i = drag.current;
            update((n) => ({
              ...n,
              polygon: n.polygon.map((v, j) => (i === j ? p : v)),
            }));
            drag.current = null;
          }
        }}
        onPointerCancel={() => {
          drag.current = null;
          pen.current = false;
          setTrail([]);
        }}
        onKeyDown={(e) => {
          const delta = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
          }[e.key];
          if (delta) {
            e.preventDefault();
            setCursor(([x, y]) => [
              Math.max(0, Math.min(8, x + delta[0])),
              Math.max(0, Math.min(5, y + delta[1])),
            ]);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            add(cursor);
          }
        }}
      >
        <rect width="640" height="420" rx="16" fill="#fbf8e9" />
        {Array.from({ length: 9 }, (_, x) => (
          <path key={"x" + x} d={`M${40 + x * 70} 35V385`} stroke="#d1d8c5" />
        ))}
        {Array.from({ length: 6 }, (_, y) => (
          <path key={"y" + y} d={`M40 ${35 + y * 70}H600`} stroke="#d1d8c5" />
        ))}
        <path d="M180 105V375" stroke="#916843" strokeWidth="9" />
        {d.sealed ? (
          <polygon
            points={d.polygon
              .map(([x, y]) => [x * 70 + 40, y * 70 + 35].join(","))
              .join(" ")}
            fill="#e8bd5c88"
            stroke="#225d52"
            strokeWidth="5"
          />
        ) : (
          <polyline
            points={d.polygon
              .map(([x, y]) => [x * 70 + 40, y * 70 + 35].join(","))
              .join(" ")}
            fill="none"
            stroke="#225d52"
            strokeWidth="5"
          />
        )}
        {trail.length > 1 && (
          <polyline
            points={trail
              .map(([x, y]) => [x * 70 + 40, y * 70 + 35].join(","))
              .join(" ")}
            fill="none"
            stroke="#2c7862"
            strokeWidth="4"
          />
        )}
        {d.polygon.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x * 70 + 40} cy={y * 70 + 35} r="10" fill="#275f53" />
            <text
              x={x * 70 + 40 + 14}
              y={y * 70 + 35 - 12}
              fill="#24463b"
              fontSize="17"
            >
              {i + 1}
            </text>
          </g>
        ))}
        {[
          [2, 1],
          [2, 4],
        ].map(([x, y]) => (
          <circle
            key={y}
            cx={x * 70 + 40}
            cy={y * 70 + 35}
            r="7"
            fill="#c54b3c"
          />
        ))}
        <circle
          cx={cursor[0] * 70 + 40}
          cy={cursor[1] * 70 + 35}
          r="16"
          fill="none"
          stroke="#b36938"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text x="195" y="405" fill="#456756" fontSize="17">
          桅杆
        </text>
      </svg>
      <div className="q4-tools">
        <button
          disabled={d.polygon.length < 3}
          onClick={() =>
            update((n) => ({
              ...n,
              sealed: !n.sealed,
              polygon: eq(n.polygon[0], n.polygon.at(-1))
                ? n.polygon.slice(0, -1)
                : n.polygon,
            }))
          }
        >
          {d.sealed ? "拆开最后一笔" : "合上最后一笔"}
        </button>
        <button
          disabled={!d.polygon.length}
          onClick={() =>
            update((n) => ({
              ...n,
              sealed: false,
              polygon: n.polygon.slice(0, -1),
            }))
          }
        >
          撤回一个点
        </button>
        <button
          disabled={!d.polygon.length}
          onClick={() => update((n) => ({ ...n, sealed: false, polygon: [] }))}
        >
          重画船帆
        </button>
      </div>
      <p className="q4-note" role="status">
        {hint ||
          (shape.valid
            ? `帆面围住${shape.area}格布。可以拖动绿色顶点，看看大小怎样变化。`
            : shape.error)}
      </p>
      <details className="q4-reference">
        <summary>看看怎样数半格、画帆边</summary>
        <p>
          沿着格点一笔一笔连。完整的一格算1；正方形沿对角线分成两半，每半算½。先画一个能围起来的形状，再检查两个红点。帆边不能交叉。
        </p>
        <svg
          viewBox="0 0 320 90"
          role="img"
          aria-label="完整方格为1，沿对角线切开的三角形为二分之一"
        >
          <rect
            x="20"
            y="10"
            width="60"
            height="60"
            fill="#d5b56c"
            stroke="#31695e"
          />
          <path d="M140 10H200L140 70Z" fill="#d5b56c" stroke="#31695e" />
          <text x="92" y="48" fill="#315447">
            1格
          </text>
          <text x="215" y="48" fill="#315447">
            半格
          </text>
        </svg>
      </details>
    </>
  );
}
export function WindPlan({ d, update, scenario }) {
  const [reef, setReef] = useState(false);
  const s = sailShape(d.polygon, d.sealed);
  return (
    <section className="q4-wind">
      <h3>把回家的风排好</h3>
      <p>
        这面帆现在每阵风走 <b>{s.valid && s.power ? s.power + scenario : 0}</b>{" "}
        格；收小帆走1格。
      </p>
      <label>
        <input
          type="checkbox"
          checked={reef}
          onChange={(e) => setReef(e.target.checked)}
        />
        下一阵风收小帆
      </label>
      <div className="q4-directions">
        {Object.entries({
          N: "↑ 向上",
          W: "← 向左",
          S: "↓ 向下",
          E: "→ 向右",
        }).map(([dir, t]) => (
          <button
            key={dir}
            disabled={d.commands.length >= 40}
            onClick={() =>
              update((n) => ({
                ...n,
                commands: [...n.commands, { dir, reef }],
              }))
            }
          >
            {t}
          </button>
        ))}
      </div>
      <ol className="q4-command-list">
        {d.commands.map((c, i) => (
          <li key={i}>
            {DIR_NAMES[c.dir]}·{c.reef ? "收小帆" : s.power + scenario + "格"}
          </li>
        ))}
      </ol>
      <button
        disabled={!d.commands.length}
        onClick={() =>
          update((n) => ({ ...n, commands: n.commands.slice(0, -1) }))
        }
      >
        撤回最后一阵风
      </button>
    </section>
  );
}
export function SeaMap({ trace = [[0, 3]], frame }) {
  const shown = trace.slice(0, (frame ?? trace.length - 1) + 1),
    pos = shown.at(-1);
  return (
    <div className="q4-sea-chart">
      <div className="q4-chart-cells">
        {Array.from({ length: 20 }, (_, i) => {
          const p = [i % 5, Math.floor(i / 5)];
          return (
            <div key={i} className={includes(SEA_ROCK, p) ? "reef" : ""}>
              {eq(p, [4, 0])
                ? "归岸"
                : eq(p, [4, 3])
                  ? "金山"
                  : includes(SEA_ROCK, p)
                    ? "礁石"
                    : eq(pos, p)
                      ? "船"
                      : ""}
            </div>
          );
        })}
      </div>
      <svg viewBox="0 0 500 400">
        <polyline
          points={shown
            .map(([x, y]) => [x * 100 + 50, y * 100 + 50].join(","))
            .join(" ")}
          fill="none"
          stroke="#e5bb66"
          strokeWidth="7"
        />
        <circle
          cx={pos[0] * 100 + 50}
          cy={pos[1] * 100 + 50}
          r="18"
          fill="#f1d58a"
          stroke="#205c61"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
}
function CowReplay({ r, frame }) {
  return (
    <div className="q4-field replay">
      <div className="q4-grid" style={{ "--cols": 5, "--rows": 4 }}>
        {Array.from({ length: 20 }, (_, i) => {
          const p = [i % 5, Math.floor(i / 5)];
          return (
            <div
              key={i}
              className={
                "q4-cell " +
                (includes(SEED, p)
                  ? "seed"
                  : includes(ROCK, p)
                    ? "rock"
                    : includes(SOIL, p)
                      ? "soil"
                      : "path")
              }
            >
              {includes(SEED, p)
                ? "小苗"
                : includes(ROCK, p)
                  ? "石头"
                  : includes(SOIL, p)
                    ? includes(r.trace.slice(0, frame + 1), p)
                      ? "已耕"
                      : "田"
                    : ""}
            </div>
          );
        })}
      </div>
      <svg className="q4-route-ink" viewBox="0 0 500 400">
        <polyline
          points={r.trace
            .slice(0, frame + 1)
            .map(([x, y]) => [x * 100 + 50, y * 100 + 50].join(","))
            .join(" ")}
          fill="none"
          stroke="#f5d477"
          strokeWidth="10"
        />
        <circle
          cx={(r.trace[frame] || [0, 3])[0] * 100 + 50}
          cy={(r.trace[frame] || [0, 3])[1] * 100 + 50}
          r="20"
          fill="#316957"
        />
      </svg>
    </div>
  );
}

export function Playback({ id, d, quiet }) {
  const [frame, setFrame] = useState(0),
    [playing, setPlaying] = useState(!quiet),
    [three, setThree] = useState(false);
  const r = d.result;
  React.useEffect(() => {
    setFrame(quiet ? (r?.trace?.length || 1) - 1 : 0);
    setPlaying(!quiet);
  }, [r, quiet]);
  React.useEffect(() => {
    if (!r?.trace || quiet || !playing || frame >= r.trace.length - 1) return;
    const t = setTimeout(() => setFrame((n) => n + 1), 550);
    return () => clearTimeout(t);
  }, [r, frame, quiet, playing]);
  if (!r) return null;
  const ink =
    id === "sea"
      ? [
          {
            color: "#285f54",
            fill: "#edc770",
            width: 8,
            points: d.polygon.map((p) => [p[0] * 80 + 40, p[1] * 80 + 30]),
          },
        ]
      : [];
  return (
    <section className="q4-playback">
      <div className="q4-board-label">
        <span>看刚才的办法怎样运行</span>
        {id !== "mill" && (
          <button onClick={() => setThree(!three)}>
            {three ? "回到路线图" : "走进立体场景"}
          </button>
        )}
      </div>
      {id === "mill" ? (
        <div className="q4-flour-outcome">
          {r.counts.map((n, i) => (
            <article key={i} style={{ "--family": PALETTE[i] }}>
              <div
                className="q4-flour-fill"
                style={{ height: Math.max(5, (n / r.total) * 160) }}
              />
              <h3>{FAMILIES[i]}</h3>
              <strong>{n}份</strong>
              <p>{[2, 3, 1][i]}个人分</p>
            </article>
          ))}
        </div>
      ) : three ? (
        <Spatial
          kind={id}
          b={{ strokes: ink, actor: id === "cow" ? "ox" : undefined }}
          result={r}
          frame={frame}
          quiet={quiet}
          caption="这些脚步来自你的图纸。转动场景可以换个角度看。"
        >
          {id === "cow" ? (
            <CowReplay r={r} frame={frame} />
          ) : (
            <SeaMap trace={r.trace} frame={frame} />
          )}
        </Spatial>
      ) : id === "sea" ? (
        <SeaMap trace={r.trace} frame={frame} />
      ) : (
        <CowReplay r={r} frame={frame} />
      )}
      {r.trace && (
        <label className="q4-scrub">
          <button
            onClick={() => {
              if (frame >= r.trace.length - 1) setFrame(0);
              setPlaying(!playing || frame >= r.trace.length - 1);
            }}
          >
            {playing && frame < r.trace.length - 1 ? "停一下" : "接着看"}
          </button>
          看看第{frame}步
          <input
            aria-label="查看执行到第几步"
            type="range"
            min="0"
            max={r.trace.length - 1}
            value={frame}
            onChange={(e) => {
              setPlaying(false);
              setFrame(Number(e.target.value));
            }}
          />
        </label>
      )}
    </section>
  );
}

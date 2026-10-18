import React, { useEffect, useRef, useState } from "react";
import Spatial from "../spatial/Spatial.jsx";
import { cowTrial, seaTrial } from "./model.mjs";
import { Sketch } from "./SketchPad.jsx";
import {
  DIRS,
  DIR_NAMES,
  COW_SOIL,
  COW_SEED,
  COW_ROCK,
  SEA_ROCK,
  SEA_HOME,
  SEA_GOLD,
  includes,
  trial,
  revise,
  allot,
} from "./model.mjs";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  Play,
  Pause,
  Check,
} from "@phosphor-icons/react";
const ICON = { N: ArrowUp, E: ArrowRight, S: ArrowDown, W: ArrowLeft };
export function Direction({ dir }) {
  const I = ICON[dir];
  return <I aria-hidden="true" />;
}
function Result({ b, onEnd }) {
  return (
    b.result && (
      <div
        className={"w3-feedback " + (b.result.ok ? "good" : "")}
        role="status"
      >
        <strong>
          {b.result.ok ? "这个办法试成了！" : "看看刚才发生了什么"}
        </strong>
        <p>{b.result.message}</p>
        <button className="w3-main-button" onClick={onEnd}>
          {b.result.ok ? "看看这一章的结尾" : "先收好这一次"}
        </button>
      </div>
    )
  );
}
function usePlayback(result, quiet) {
  const [frame, setFrame] = useState(0),
    [playing, setPlaying] = useState(false);
  const length = result?.trace?.length || 1;
  useEffect(() => {
    setFrame(quiet ? length - 1 : 0);
    setPlaying(!quiet && length > 1);
  }, [result, quiet, length]);
  useEffect(() => {
    if (!playing) return;
    if (frame >= length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(
      () => setFrame((n) => Math.min(length - 1, n + 1)),
      420,
    );
    return () => clearTimeout(t);
  }, [frame, playing, length]);
  return {
    frame,
    playing,
    setPlaying,
    replay: () => {
      setFrame(quiet ? length - 1 : 0);
      setPlaying(!quiet);
    },
  };
}
function Playback({ p, result }) {
  return (
    result?.trace?.length > 1 && (
      <div className="w3-playback">
        <button
          onClick={() => p.setPlaying(!p.playing)}
          disabled={p.frame >= result.trace.length - 1}
        >
          {p.playing ? <Pause /> : <Play />}
          {p.playing ? "停一下，看一看" : "接着走"}
        </button>
        <button onClick={p.replay}>
          <ArrowCounterClockwise />
          重看这条路线
        </button>
        <span>走到第{p.frame}步</span>
      </div>
    )
  );
}
function TileWorld({ kind, b, result, frame }) {
  const sea = kind === "sea",
    rocks = sea ? SEA_ROCK : COW_ROCK,
    trace = result?.trace?.slice(0, frame + 1) || [[0, 3]],
    pos = trace.at(-1),
    cells = Array.from({ length: 20 }, (_, i) => [i % 5, Math.floor(i / 5)]);
  return (
    <svg
      className={"w3-game-grid " + (sea ? "sea" : "field")}
      viewBox="0 0 640 530"
      role="img"
      aria-label={
        sea
          ? "海图：五列四行，船从左下出发，家在右上，金山在右下，三处礁石"
          : "田地图：五列四行，耕牛从左下出发；8块田、两处小苗和一块石头"
      }
    >
      <defs>
        <pattern
          id={"grid-" + kind}
          width="110"
          height="110"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 20Q25 5 50 20T100 20"
            fill="none"
            stroke="#73abb0"
            strokeOpacity=".35"
          />
        </pattern>
      </defs>
      {["一", "二", "三", "四", "五"].map((n, i) => (
        <text
          key={n}
          x={100 + i * 110}
          y="31"
          textAnchor="middle"
          fill="#496f6b"
          fontSize="17"
        >
          {n}列
        </text>
      ))}
      {["一", "二", "三", "四"].map((n, i) => (
        <text
          key={n}
          x="20"
          y={110 + i * 110}
          textAnchor="middle"
          fill="#496f6b"
          fontSize="14"
        >
          {n}
        </text>
      ))}
      {cells.map(([x, y]) => {
        const rock = includes(rocks, [x, y]),
          seed = !sea && includes(COW_SEED, [x, y]),
          soil = !sea && includes(COW_SOIL, [x, y]),
          done = soil && includes(trace, [x, y]),
          home = sea && includes([SEA_HOME], [x, y]),
          gold = sea && includes([SEA_GOLD], [x, y]);
        return (
          <g
            key={x + "-" + y}
            transform={
              "translate(" + (45 + x * 110) + " " + (48 + y * 110) + ")"
            }
          >
            <rect
              width="108"
              height="108"
              rx="8"
              fill={
                sea
                  ? home
                    ? "#e4d3a1"
                    : "#c2e4e0"
                  : soil
                    ? done
                      ? "#b27c48"
                      : "#dbc399"
                    : "#e1e5c9"
              }
              stroke="#fff8e8"
              strokeWidth="3"
            />
            {sea && !home && (
              <rect width="108" height="108" fill={"url(#grid-" + kind + ")"} />
            )}{" "}
            {done && (
              <path
                d="M12 26H96M12 44H96M12 62H96M12 80H96"
                stroke="#7f5834"
                strokeWidth="3"
              />
            )}
            {rock && (
              <>
                <path d="M22 72L35 28 70 25 90 72Z" fill="#6e8b86" />
                <text x="54" y="95" textAnchor="middle" fontSize="17">
                  {sea ? "礁石" : "石头"}
                </text>
              </>
            )}
            {seed && (
              <>
                <path
                  d="M53 78V40M53 60Q15 60 28 32Q51 31 53 60M54 52Q85 51 80 28Q54 30 54 52"
                  fill="#537b43"
                />
                <text x="54" y="99" textAnchor="middle" fontSize="16">
                  小苗
                </text>
              </>
            )}
            {soil && !done && (
              <text
                x="54"
                y="95"
                textAnchor="middle"
                fontSize="16"
                fill="#805b34"
              >
                2平方米
              </text>
            )}
            {home && (
              <>
                <path
                  d="M23 45L54 18 88 45M30 44V82H80V44"
                  stroke="#b56840"
                  strokeWidth="6"
                  fill="#fff1cf"
                />
                <text x="54" y="101" textAnchor="middle" fontSize="16">
                  归岸处
                </text>
              </>
            )}
            {gold && (
              <>
                <path d="M15 72L50 21 90 72Z" fill="#d6a337" />
                <text x="54" y="98" textAnchor="middle" fontSize="16">
                  金山
                </text>
              </>
            )}
            {x === 0 && y === 3 && (
              <text x="54" y="100" textAnchor="middle" fontSize="16">
                出发处
              </text>
            )}
          </g>
        );
      })}
      {trace.length > 1 && (
        <polyline
          points={trace
            .map(([x, y]) => [100 + x * 110, 103 + y * 110].join(","))
            .join(" ")}
          fill="none"
          stroke={sea ? "#2c6a82" : "#a1512d"}
          strokeWidth="4"
          strokeDasharray="6 5"
        />
      )}
      <g
        className="w3-moving-drawing"
        transform={
          "translate(" + (pos[0] * 110 + 56) + " " + (pos[1] * 110 + 52) + ")"
        }
      >
        {sea && <path d="M0 66H88L72 89H17Z" fill="#694e38" />}
        <svg width="88" height="72" viewBox="0 0 800 480">
          <SketchInk strokes={b.strokes} />
        </svg>
      </g>
      <text x="320" y="515" textAnchor="middle" fill="#496f6b" fontSize="17">
        {sea
          ? "轻风走1格，大一点的风走2格。"
          : "一格一格走；同一块田只算一次。"}
      </text>
    </svg>
  );
}
function SketchInk({ strokes }) {
  return strokes.map((s, i) =>
    s.points.length === 1 ? (
      <circle
        key={i}
        cx={s.points[0][0]}
        cy={s.points[0][1]}
        r={s.width / 2}
        fill={s.color}
      />
    ) : (
      <polyline
        key={i}
        points={s.points.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={s.color}
        strokeWidth={s.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  );
}
export function CowGame({ b, set, quiet, onEnd }) {
  const p = usePlayback(b.result, quiet);
  const [sceneNote, setSceneNote] = useState("");
  const add = (d) => {
    if (b.route.length < 40) set(revise(b, { route: [...b.route, d] }));
  };
  return (
    <>
      <div className="w3-game-layout">
        <div>
          <Spatial
            kind="cow"
            b={b}
            result={b.result}
            frame={p.frame}
            quiet={quiet}
            caption={
              sceneNote ||
              "点相邻田块排路，也可以用方向牌。排好后，请耕牛试走。"
            }
            onAction={(a) => {
              if (a.type !== "tile" || p.playing) return;
              const pos = cowTrial(b.route).trace.at(-1);
              const dx = a.x - pos[0],
                dy = a.z - pos[1];
              if (Math.abs(dx) + Math.abs(dy) !== 1) {
                setSceneNote("从路线末尾，选紧挨着的一格。也可以撤回一步。");
                return;
              }
              add(dx === 1 ? "E" : dx === -1 ? "W" : dy === 1 ? "S" : "N");
              setSceneNote("这一步排好了。再选一格，或请耕牛走一走。");
            }}
          >
            <TileWorld kind="cow" b={b} result={b.result} frame={p.frame} />
          </Spatial>
          <Playback p={p} result={b.result} />
          <details>
            <summary>用文字看田地图</summary>
            <p>
              出发处：第一列第四行。小苗：第一列第二、三行。石头：第三列第二行。要耕的田：第二至四列的第一、三行，以及第二列第二行、第四列第二行。
            </p>
          </details>
        </div>
        <div className="w3-console">
          <h2>给耕牛排一条路</h2>
          <p>
            从左下角出发，耕完8小块田，每块2平方米。绕开小苗和石头。每张方向牌走1格。
          </p>
          <div className="w3-direction-pad">
            {Object.keys(DIRS).map((d) => (
              <button
                key={d}
                aria-label={"加入" + DIR_NAMES[d]}
                disabled={p.playing || b.route.length >= 40}
                onClick={() => add(d)}
              >
                <Direction dir={d} />
                {DIR_NAMES[d]}
              </button>
            ))}
          </div>
          <ol className="w3-command-strip" aria-label="耕牛路线">
            {b.route.map((d, i) => (
              <li key={i} title={"第" + (i + 1) + "步" + DIR_NAMES[d]}>
                <Direction dir={d} />
                <small>{i + 1}</small>
              </li>
            ))}
          </ol>
          {!b.route.length && (
            <p className="w3-muted">先点方向牌，把想到的路线排出来。</p>
          )}
          <div className="w3-actions">
            <button
              disabled={!b.route.length || p.playing}
              onClick={() => set(revise(b, { route: b.route.slice(0, -1) }))}
            >
              撤回一步
            </button>
            <button
              disabled={!b.route.length || p.playing}
              onClick={() => set(revise(b, { route: [] }))}
            >
              重新排路
            </button>
          </div>
          <button
            className="w3-main-button"
            disabled={p.playing || !b.route.length}
            onClick={() => set(trial("cow", b))}
          >
            <Play />
            请耕牛走一走
          </button>
          {b.result?.ok && (
            <fieldset>
              <legend>8小块田，每块2平方米，共有多大？</legend>
              {["8", "16", "18"].map((n) => (
                <button
                  key={n}
                  aria-pressed={b.area === n}
                  onClick={() => set({ ...b, area: n })}
                >
                  {n}平方米
                </button>
              ))}
              {b.area && (
                <p role="status">
                  {b.area === "16"
                    ? "对了，8×2＝16（平方米）。"
                    : "一块是2平方米，把8个2加起来再想想。"}
                </p>
              )}
            </fieldset>
          )}
        </div>
      </div>
      {!p.playing && <Result b={b} onEnd={onEnd} />}
    </>
  );
}
export function MillGame({ b, set, onEnd, quiet }) {
  const ref = useRef(null),
    gesture = useRef(null),
    [selected, setSelected] = useState(false);
  const remaining = b.quarters * 3 - b.bags.reduce((a, n) => a + n, 0),
    names = ["鲁伯家", "周婶家", "阿婆家"],
    people = [2, 3, 1];
  const turn = () =>
    set((n) => (n.quarters < 4 ? revise(n, { quarters: n.quarters + 1 }) : n));
  const angle = (e) => {
    const r = ref.current.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - r.y - r.height / 2,
        e.clientX - r.x - r.width / 2,
      ) *
        180) /
      Math.PI
    );
  };
  const place = (i) => {
    set((n) => allot(n, i, 1));
    setSelected(false);
  };
  return (
    <>
      <div className="w3-game-layout mill">
        <div className="w3-mill-stage">
          <Spatial
            kind="mill"
            b={b}
            result={b.result}
            quiet={quiet}
            caption={
              selected
                ? "面粉拿好了，点一家篮子放进去。"
                : "点磨柄转四分之一圈；磨好后，点面粉，再点一家篮子。"
            }
            onAction={(a) => {
              if (a.type === "turn") turn();
              if (a.type === "grain" && remaining > 0) setSelected(true);
              if (a.type === "bag" && selected && remaining > 0) place(a.index);
            }}
          >
            <div className="w3-mill-ring">
              <svg
                ref={ref}
                viewBox="0 0 400 400"
                role="img"
                aria-label={"石磨，已经转了" + b.quarters + "个四分之一圈"}
                className="w3-mill"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  gesture.current = { angle: angle(e), sum: 0 };
                  ref.current.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const g = gesture.current;
                  if (!g) return;
                  const a = angle(e);
                  let delta = a - g.angle;
                  if (delta > 180) delta -= 360;
                  if (delta < -180) delta += 360;
                  g.sum += delta;
                  g.angle = a;
                  if (g.sum >= 85) {
                    turn();
                    g.sum -= 90;
                  }
                }}
                onPointerUp={() => (gesture.current = null)}
                onPointerCancel={() => (gesture.current = null)}
              >
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  fill="#e6dac2"
                  stroke="#a69c82"
                  strokeWidth="12"
                />
                <g
                  style={{
                    transform: "rotate(" + b.quarters * 90 + "deg)",
                    transformOrigin: "200px 200px",
                  }}
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="145"
                    fill="#a8b2a3"
                    stroke="#627b74"
                    strokeWidth="10"
                  />
                  {Array.from({ length: 12 }, (_, i) => (
                    <path
                      key={i}
                      d="M200 96L235 69"
                      transform={"rotate(" + i * 30 + " 200 200)"}
                      stroke="#71897d"
                      strokeWidth="5"
                    />
                  ))}
                  <circle cx="200" cy="200" r="28" fill="#516b60" />
                  <path
                    d="M307 200H365"
                    stroke="#865b3c"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="45" r="10" fill="#bf603b" />
                </g>
                <text
                  x="200"
                  y="265"
                  textAnchor="middle"
                  fill="#173e43"
                  fontSize="28"
                >
                  {b.quarters === 4 ? "1圈" : b.quarters + "/4圈"}
                </text>
              </svg>
            </div>
          </Spatial>
        </div>
        <div className="w3-console">
          <h2>每人分到2份面粉</h2>
          <p>每转四分之一圈，磨出3份。先磨满一圈，再按人数分给三家。</p>
          <button
            className="w3-main-button"
            disabled={b.quarters === 4}
            onClick={turn}
          >
            顺时针转四分之一圈
          </button>
          <p>也可以按住磨柄，顺时针转动。红点回到上方，就是一圈。</p>
          <p role="status" className="w3-mill-count" key={b.quarters}>
            {b.quarters
              ? "已经磨出" +
                b.quarters * 3 +
                "份面粉。" +
                (b.quarters === 4
                  ? "正好一圈！"
                  : "再转一转，看看还会增加几份。")
              : "粮袋还是空的，先转一转石磨。"}
          </p>
          <div className="w3-grain-pool">
            <Sketch strokes={b.strokes} label="我画的粮袋" />
            <strong>粮袋里还有{remaining}份</strong>
            <button
              draggable={remaining > 0}
              disabled={remaining === 0}
              aria-pressed={selected}
              onDragStart={(e) => e.dataTransfer.setData("text/x-grain", "one")}
              onClick={() => setSelected(!selected)}
            >
              拿起1份面粉
            </button>
          </div>
          <div className="w3-families">
            {names.map((name, i) => (
              <section key={name}>
                <h3>
                  {name} · {people[i]}人
                </h3>
                <div className="w3-persons" aria-hidden="true">
                  {Array.from({ length: people[i] }, (_, j) => (
                    <i key={j} />
                  ))}
                </div>
                <button
                  className="w3-basket"
                  aria-label={"把1份面粉放到" + name}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (
                      e.dataTransfer.getData("text/x-grain") === "one" &&
                      remaining > 0
                    )
                      place(i);
                  }}
                  onClick={() => {
                    if (selected && remaining > 0) place(i);
                  }}
                >
                  <span>{b.bags[i]}份</span>
                  <small>{selected ? "放进这里" : "先拿面粉，再放这里"}</small>
                </button>
                <button
                  disabled={b.bags[i] === 0}
                  onClick={() => set((n) => allot(n, i, -1))}
                >
                  取回1份
                </button>
              </section>
            ))}
          </div>
          <p>可以拖面粉，也可以点“拿起1份面粉”，再点一家。取回后还能重新分。</p>
          <button
            className="w3-main-button"
            onClick={() => set(trial("mill", b))}
          >
            <Check />
            请三家数一数
          </button>
          {b.result && !b.result.ok && (
            <p>鲁伯家需要2×2份，周婶家需要3×2份，阿婆家需要1×2份。</p>
          )}
        </div>
      </div>
      <Result b={b} onEnd={onEnd} />
    </>
  );
}
export function SeaGame({ b, set, quiet, onEnd }) {
  const p = usePlayback(b.result, quiet);
  const [sceneNote, setSceneNote] = useState("");
  return (
    <>
      <div className="w3-game-layout">
        <div>
          <Spatial
            kind="sea"
            b={b}
            result={b.result}
            frame={p.frame}
            quiet={quiet}
            caption={
              sceneNote || "点同一行或同一列的近处海面，排一阵风；最多走2格。"
            }
            onAction={(a) => {
              if (a.type !== "tile" || p.playing || b.sail.length >= 30) return;
              const pos = seaTrial(b.sail).trace.at(-1);
              const dx = a.x - pos[0],
                dy = a.z - pos[1],
                dist = Math.abs(dx) + Math.abs(dy);
              if ((dx && dy) || !dist || dist > 2) {
                setSceneNote("从路线末尾，在同一行或同一列选1格或2格。");
                return;
              }
              set(
                revise(b, {
                  sail: [
                    ...b.sail,
                    {
                      dir: dx > 0 ? "E" : dx < 0 ? "W" : dy > 0 ? "S" : "N",
                      strength: dist,
                    },
                  ],
                }),
              );
              setSceneNote("这阵风排好了。礁石前后都要仔细看看。");
            }}
          >
            <TileWorld kind="sea" b={b} result={b.result} frame={p.frame} />
          </Spatial>
          <Playback p={p} result={b.result} />
          <details>
            <summary>用文字看海图</summary>
            <p>
              出发处：第一列第四行。归岸处：第五列第一行。金山：第五列第四行。礁石：第二列第四行、第三列第三行、第四列第二行。
            </p>
          </details>
        </div>
        <div className="w3-console">
          <h2>让风把船送到哪里？</h2>
          <p>船上的人望着岸边。大官却指着金山：“先去那里！”</p>
          <div className="w3-destination">
            {[
              ["home", "先送大家回家"],
              ["gold", "先到金山看看"],
            ].map(([v, label]) => (
              <button
                key={v}
                disabled={p.playing}
                aria-pressed={b.destination === v}
                onClick={() => set(revise(b, { destination: v }))}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="w3-dialogue">
            {b.destination === "home"
              ? "小禾：“先看归岸处，再避开礁石。大家正等着回家呢。”"
              : "船夫：“金山也许很亮，可别忘了留一条回家的路。”"}
          </p>
          <h3>选风吹去的方向</h3>
          <div className="w3-direction-pad">
            {Object.keys(DIRS).map((d) => (
              <button
                key={d}
                disabled={p.playing}
                aria-label={"风吹" + DIR_NAMES[d]}
                aria-pressed={b.wind === d}
                onClick={() => set({ ...b, wind: d })}
              >
                <Direction dir={d} />
                {DIR_NAMES[d]}
              </button>
            ))}
          </div>
          <fieldset>
            <legend>这阵风走几格？</legend>
            {[1, 2].map((n) => (
              <button
                key={n}
                disabled={p.playing}
                aria-pressed={b.strength === n}
                onClick={() => set({ ...b, strength: n })}
              >
                {n === 1 ? "轻风 · 1格" : "大一点 · 2格"}
              </button>
            ))}
          </fieldset>
          <button
            disabled={p.playing || b.sail.length >= 30}
            onClick={() =>
              set(
                revise(b, {
                  sail: [...b.sail, { dir: b.wind, strength: b.strength }],
                }),
              )
            }
          >
            加上这阵风
          </button>
          <ol className="w3-command-strip" aria-label="风的路线">
            {b.sail.map((m, i) => (
              <li key={i} title={DIR_NAMES[m.dir] + m.strength + "格"}>
                <Direction dir={m.dir} />
                {m.strength}
              </li>
            ))}
          </ol>
          <div className="w3-actions">
            <button
              disabled={p.playing || !b.sail.length}
              onClick={() => set(revise(b, { sail: b.sail.slice(0, -1) }))}
            >
              撤回一阵风
            </button>
            <button
              disabled={p.playing || !b.sail.length}
              onClick={() => set(revise(b, { sail: [] }))}
            >
              重新排风向
            </button>
          </div>
          <button
            className="w3-main-button"
            disabled={p.playing || !b.sail.length}
            onClick={() => set(trial("sea", b))}
          >
            <Play />
            扬帆，试试这条路
          </button>
        </div>
      </div>
      {!p.playing && <Result b={b} onEnd={onEnd} />}
    </>
  );
}

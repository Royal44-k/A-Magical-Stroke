import React, { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  PaintBrush,
  LinkSimple,
  Check,
  Trash,
  Lightbulb,
  Play,
  Pause,
} from "@phosphor-icons/react";
import { COLORS, SOURCE, FIELD, DOOR, distance, flowFrame } from "./engine.mjs";
export const Ink = ({ strokes, className = "" }) => (
  <g className={className}>
    {strokes.map((s, i) =>
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
    )}
  </g>
);
export function Artwork({ strokes, kind }) {
  return (
    <svg
      viewBox="0 0 800 480"
      role="img"
      aria-label={kind === "canopy" ? "我画的伞" : "我画的水路"}
    >
      <rect width="800" height="480" fill="#faf6ec" />
      <Ink strokes={strokes} />
    </svg>
  );
}
export default function PaintBoard({
  kind,
  strokes,
  onChange,
  result,
  quiet,
  onTest,
  bridge,
  disabled = false,
}) {
  const svg = useRef(null),
    draftRef = useRef(null),
    [draft, setDraft] = useState(null),
    [color, setColor] = useState(COLORS[0]),
    [width, setWidth] = useState(9),
    [mode, setMode] = useState("pen"),
    [penDown, setPenDown] = useState(false),
    [cursor, setCursor] = useState(kind === "river" ? SOURCE : [240, 170]),
    [redo, setRedo] = useState([]),
    [hint, setHint] = useState(false),
    [clear, setClear] = useState(false),
    [walk, setWalk] = useState(0),
    [playing, setPlaying] = useState(false),
    [replay, setReplay] = useState(0);
  useEffect(() => {
    setDraft(null);
    draftRef.current = null;
    setPenDown(false);
    setRedo([]);
    setCursor(kind === "river" ? SOURCE : [240, 170]);
  }, [kind]);
  useEffect(() => {
    setWalk(quiet ? 100 : 0);
    setPlaying(!quiet && !!(result?.flow?.length || result?.path?.length));
  }, [result, quiet, replay]);
  useEffect(() => {
    if (!playing) return;
    if (walk >= 100) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setWalk(Math.min(100, walk + 2)), 40);
    return () => clearTimeout(t);
  }, [playing, walk]);
  const coordinate = (e) => {
    const r = svg.current.getBoundingClientRect();
    return [
      Math.max(0, Math.min(800, ((e.clientX - r.left) / r.width) * 800)),
      Math.max(0, Math.min(480, ((e.clientY - r.top) / r.height) * 480)),
    ];
  };
  const change = (next) => {
    setRedo([]);
    onChange(next);
    setClear(false);
  };
  const dot = (p) => {
    setCursor(p);
    if (!penDown) {
      if (strokes.length >= 60) return;
      change([...strokes, { color, width, points: [p] }]);
      setPenDown(true);
    } else {
      const last = strokes.at(-1);
      if (!last || last.points.length >= 500) {
        setPenDown(false);
        return;
      }
      change([
        ...strokes.slice(0, -1),
        { ...last, points: [...last.points, p] },
      ]);
    }
  };
  const start = (e) => {
    if (disabled || e.button !== 0) return;
    if (mode === "dots") {
      dot(coordinate(e));
      return;
    }
    if (strokes.length >= 60) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const d = { color, width, points: [coordinate(e)] };
    draftRef.current = d;
    setDraft(d);
  };
  const move = (e) => {
    if (!draftRef.current) return;
    const p = coordinate(e),
      d = draftRef.current;
    if (d.points.length < 500 && distance(p, d.points.at(-1)) > 2) {
      const next = { ...d, points: [...d.points, p] };
      draftRef.current = next;
      setDraft(next);
    }
  };
  const end = (e) => {
    if (!draftRef.current) return;
    const d = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (e.type !== "pointercancel") change([...strokes, d]);
  };
  const key = (e) => {
    if (disabled) return;
    const offsets = {
      ArrowLeft: [-40, 0],
      ArrowRight: [40, 0],
      ArrowUp: [0, -40],
      ArrowDown: [0, 40],
    };
    if (offsets[e.key]) {
      e.preventDefault();
      const d = offsets[e.key];
      setCursor(([x, y]) => [
        Math.max(0, Math.min(800, x + d[0])),
        Math.max(0, Math.min(480, y + d[1])),
      ]);
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMode("dots");
      dot(cursor);
    }
    if (e.key === "Escape") {
      setPenDown(false);
      setDraft(null);
      draftRef.current = null;
    }
  };
  const water = flowFrame(result, walk / 100);
  return (
    <section
      className={"v2-paint " + (result ? "tested" : "")}
      aria-label={kind === "canopy" ? "画伞与试雨" : "画水路与试水"}
    >
      <div className="v2-tools">
        <div className="v2-mode">
          <button
            aria-pressed={mode === "pen"}
            onClick={() => {
              setMode("pen");
              setPenDown(false);
            }}
          >
            <PaintBrush />
            自由画
          </button>
          <button
            aria-pressed={mode === "dots"}
            onClick={() => setMode("dots")}
          >
            <LinkSimple />
            连点画
          </button>
        </div>
        <div className="v2-colors" aria-label="画笔颜色">
          {COLORS.map((c, i) => (
            <button
              key={c}
              style={{ "--ink": c }}
              aria-label={["青色画笔", "朱红画笔", "金色画笔", "绿色画笔"][i]}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            >
              {color === c && <Check />}
            </button>
          ))}
        </div>
        <select
          aria-label="笔画粗细"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        >
          <option value={5}>细笔</option>
          <option value={9}>中笔</option>
          <option value={14}>粗笔</option>
        </select>
        <button
          title="撤回上一笔"
          aria-label="撤回上一笔"
          disabled={!strokes.length}
          onClick={() => {
            setRedo((r) => [...r, strokes.at(-1)]);
            onChange(strokes.slice(0, -1));
            setPenDown(false);
          }}
        >
          <ArrowCounterClockwise />
        </button>
        <button
          title="放回上一笔"
          aria-label="放回上一笔"
          disabled={!redo.length}
          onClick={() => {
            onChange([...strokes, redo.at(-1)]);
            setRedo((r) => r.slice(0, -1));
            setPenDown(false);
          }}
        >
          <ArrowClockwise />
        </button>
        <button aria-pressed={hint} onClick={() => setHint((v) => !v)}>
          <Lightbulb />
          小禾示范
        </button>
        <button aria-label="重新画这张" onClick={() => setClear((v) => !v)}>
          <Trash />
        </button>
      </div>
      {clear && (
        <div className="v2-inline-confirm">
          <span>收起画纸上的这些笔迹？试过的画还留在画册里。</span>
          <button
            onClick={() => {
              change([]);
              setPenDown(false);
            }}
          >
            收起，重新画
          </button>
          <button onClick={() => setClear(false)}>接着画</button>
        </div>
      )}
      <div className="v2-paper">
        <svg
          ref={svg}
          viewBox="0 0 800 480"
          tabIndex={0}
          role="group"
          aria-label="我的画纸，方向键移动笔尖，回车落笔，Escape提笔"
          onKeyDown={key}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className={"v2-draw-surface " + mode}
        >
          <defs>
            <pattern
              id={"dots-" + kind}
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="0" cy="0" r="1.2" fill="#a9b8ad" />
            </pattern>
          </defs>
          <rect width="800" height="480" fill="#faf6ec" />
          {mode === "dots" && (
            <rect width="800" height="480" fill={"url(#dots-" + kind + ")"} />
          )}
          {kind === "canopy" ? (
            <g className="v2-board-guides">
              <rect
                x="225"
                y="365"
                width="350"
                height="80"
                rx="5"
                fill="#e9ddbd"
              />
              <rect
                x="250"
                y="350"
                width="300"
                height="65"
                fill="#fffdf3"
                stroke="#c4b58e"
              />
              <text x="400" y="390" textAnchor="middle">
                别让画纸淋湿
              </text>
              {hint && (
                <path d="M210 220 Q265 115 345 100" className="v2-hint-line" />
              )}
            </g>
          ) : (
            <g className="v2-board-guides">
              <path d="M0 300 Q55 280 105 325 L105 480 H0Z" fill="#c5e2dc" />
              <rect
                x="675"
                y="70"
                width="100"
                height="110"
                rx="12"
                fill="#dce7ad"
              />
              <text x="725" y="55" textAnchor="middle">
                田边
              </text>
              <circle cx={SOURCE[0]} cy={SOURCE[1]} r="29" fill="#267580" />
              <text x="80" y="345" textAnchor="middle" fill="#fffdf3">
                水
              </text>
              <text x="75" y="400" textAnchor="middle">
                从这里画
              </text>
              <circle
                cx={FIELD[0]}
                cy={FIELD[1]}
                r="29"
                fill="none"
                stroke="#668335"
                strokeWidth="3"
                strokeDasharray="5 5"
              />
              <rect
                {...DOOR}
                width={DOOR.w}
                height={DOOR.h}
                rx="12"
                fill="#e9d8b8"
              />
              <text
                x="405"
                y="190"
                textAnchor="middle"
                visibility={bridge?.tested ? "hidden" : "visible"}
              >
                门前的路
              </text>
              {hint && (
                <path
                  d="M80 340 L140 340 Q160 340 160 300"
                  className="v2-hint-line"
                />
              )}
              {bridge?.tested && (
                <g>
                  <rect
                    x="315"
                    y="250"
                    width="180"
                    height="36"
                    rx="4"
                    fill="#a97749"
                  />
                  <path
                    d="M325 254 V282 M350 254 V282 M375 254 V282 M400 254 V282 M425 254 V282 M450 254 V282 M475 254 V282"
                    stroke="#e5c794"
                    strokeWidth="4"
                  />
                  <text x="405" y="320" textAnchor="middle">
                    桥已试过
                  </text>
                </g>
              )}
            </g>
          )}
          <Ink strokes={strokes} />
          {draft && <Ink strokes={[draft]} />}
          {mode === "dots" && (
            <g>
              <circle
                cx={cursor[0]}
                cy={cursor[1]}
                r="12"
                fill="none"
                stroke="#a34b18"
                strokeWidth="2"
              />
              <circle cx={cursor[0]} cy={cursor[1]} r="3" fill="#a34b18" />
            </g>
          )}
          {kind === "canopy" &&
            result?.drops?.map((d, i) => (
              <g key={i}>
                <line
                  x1={d.x}
                  x2={d.x}
                  y1="0"
                  y2={d.y}
                  stroke="#6bb2b9"
                  strokeWidth="3"
                  strokeDasharray="9 24"
                  className={quiet ? "" : "v2-rainfall"}
                />
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={d.stopped ? 5 : 9}
                  fill={d.stopped ? "#4d9ca6" : "#8dbec4"}
                />
              </g>
            ))}
          {kind === "river" && water.d && (
            <g className="v21-live-water">
              <path
                d={water.d}
                stroke="#69c7cf"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
              {water.heads.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="7"
                  fill="#267580"
                  stroke="#fffdf2"
                  strokeWidth="2"
                />
              ))}
              {walk === 100 && result.arrived && (
                <circle
                  cx={FIELD[0]}
                  cy={FIELD[1]}
                  r="29"
                  fill="none"
                  stroke="#668335"
                  strokeWidth="4"
                />
              )}
              {walk === 100 && result.blocked && result.doorHit && (
                <g className="v21-door-hit">
                  <circle
                    cx={result.doorHit[0]}
                    cy={result.doorHit[1]}
                    r="16"
                    fill="#faf6ec"
                    stroke="#b95739"
                    strokeWidth="4"
                  />
                  <path
                    d={
                      "M" +
                      (result.doorHit[0] - 6) +
                      "," +
                      (result.doorHit[1] - 6) +
                      "l12,12m0,-12l-12,12"
                    }
                    stroke="#b95739"
                    strokeWidth="3"
                  />
                  <title>这里也有水，门前过不去了</title>
                </g>
              )}
            </g>
          )}
          {kind === "river" && (
            <text
              x={SOURCE[0]}
              y={SOURCE[1] + 9}
              textAnchor="middle"
              fontFamily="Microsoft YaHei,sans-serif"
              fontSize="27"
              fill="#fffdf3"
              pointerEvents="none"
            >
              水
            </text>
          )}
        </svg>
        <span className="v2-paper-corner">你的每一笔，都会留下来</span>
      </div>
      {kind === "river" &&
        !!(result?.flow?.length || result?.path?.length) &&
        !quiet && (
          <div className="v21-flow-controls">
            <span>接上的支路，也会有水走过去。</span>
            <button
              onClick={() => {
                if (walk >= 100) setReplay((n) => n + 1);
                else setPlaying((v) => !v);
              }}
            >
              {playing ? <Pause /> : <Play />}
              {playing ? "停一停" : walk >= 100 ? "再看一遍" : "接着看"}
            </button>
          </div>
        )}
      <div className="v2-brush-footer">
        <span>
          {mode === "dots"
            ? penDown
              ? "接着点，线就连起来。换一笔时点“提笔”。"
              : "点一个地方开始。也可用方向键和回车画。"
            : "按住画纸拖动画。松开，就是一笔。"}
        </span>
        {mode === "dots" && (
          <button onClick={() => setPenDown(false)} disabled={!penDown}>
            提笔，换一笔
          </button>
        )}
        <button
          className="v2-primary"
          disabled={disabled || !strokes.length}
          onClick={() => {
            setPenDown(false);
            onTest();
          }}
        >
          {kind === "canopy" ? "画好了，试一阵雨" : "画好了，让水走一走"}
        </button>
      </div>
    </section>
  );
}

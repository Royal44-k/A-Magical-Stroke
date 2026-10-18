import React, { useRef, useState } from "react";
import { Ink } from "../v2/PaintBoard.jsx";
import { COLORS } from "../v2/engine.mjs";
import {
  ArrowCounterClockwise,
  Trash,
  PaintBrush,
  Cursor,
} from "@phosphor-icons/react";
const LABELS = ["青墨", "朱红", "麦黄", "草绿"];
export function Sketch({ strokes, label = "我的画", ...props }) {
  return (
    <svg viewBox="0 0 800 480" role="img" aria-label={label} {...props}>
      <Ink strokes={strokes} />
    </svg>
  );
}
export default function SketchPad({ strokes, onChange, title }) {
  const ref = useRef(null),
    draftRef = useRef(null);
  const [draft, setDraft] = useState(null),
    [color, setColor] = useState(COLORS[0]),
    [width, setWidth] = useState(9),
    [mode, setMode] = useState("pen"),
    [cursor, setCursor] = useState([240, 240]),
    [drawing, setDrawing] = useState(false),
    [clear, setClear] = useState(false);
  const point = (e) => {
    const p = ref.current.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(ref.current.getScreenCTM().inverse());
    return [Math.max(0, Math.min(800, q.x)), Math.max(0, Math.min(480, q.y))];
  };
  const start = (p) => {
    if (strokes.length >= 60) return;
    const d = { color, width, points: [p] };
    draftRef.current = d;
    setDraft(d);
  };
  const extend = (p) => {
    const d = draftRef.current;
    if (!d || d.points.length >= 500) return;
    const n = { ...d, points: [...d.points, p] };
    draftRef.current = n;
    setDraft(n);
  };
  const end = () => {
    const d = draftRef.current;
    if (d) onChange([...strokes, d]);
    draftRef.current = null;
    setDraft(null);
    setDrawing(false);
  };
  const dot = (p) => {
    setCursor(p);
    if (!draftRef.current) {
      start(p);
      setDrawing(true);
    } else extend(p);
  };
  return (
    <section className="w3-sketch">
      <div className="w3-toolbar" aria-label="画笔工具">
        <div>
          {COLORS.map((c, i) => (
            <button
              key={c}
              aria-label={LABELS[i] + "画笔"}
              aria-pressed={color === c}
              style={{ "--ink": c }}
              className="w3-ink"
              onClick={() => setColor(c)}
            >
              <i />
              {LABELS[i]}
            </button>
          ))}
        </div>
        <div>
          <button
            aria-pressed={mode === "pen"}
            onClick={() => {
              end();
              setMode("pen");
            }}
          >
            <PaintBrush />
            拖着画
          </button>
          <button
            aria-pressed={mode === "dot"}
            onClick={() => {
              end();
              setMode("dot");
            }}
          >
            <Cursor />
            连点画
          </button>
          <label>
            笔尖
            <select
              aria-label="笔尖粗细"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            >
              <option value={5}>细</option>
              <option value={9}>中</option>
              <option value={14}>粗</option>
            </select>
          </label>
        </div>
      </div>
      <svg
        ref={ref}
        className="w3-paper"
        onBlur={end}
        viewBox="0 0 800 480"
        tabIndex={0}
        role="application"
        aria-label={title + "画纸；方向键移动，回车落笔，空格或Escape提笔"}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          ref.current.focus();
          const p = point(e);
          if (mode === "dot") {
            dot(p);
            return;
          }
          ref.current.setPointerCapture(e.pointerId);
          start(p);
        }}
        onPointerMove={(e) => {
          if (mode === "pen" && draftRef.current) extend(point(e));
        }}
        onPointerUp={(e) => {
          if (mode === "pen") {
            end();
            if (ref.current.hasPointerCapture(e.pointerId))
              ref.current.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          draftRef.current = null;
          setDraft(null);
          setDrawing(false);
        }}
        onKeyDown={(e) => {
          const dirs = {
            ArrowLeft: [-20, 0],
            ArrowRight: [20, 0],
            ArrowUp: [0, -20],
            ArrowDown: [0, 20],
          };
          if (dirs[e.key]) {
            e.preventDefault();
            setMode("dot");
            const d = dirs[e.key];
            setCursor(([x, y]) => [
              Math.max(0, Math.min(800, x + d[0])),
              Math.max(0, Math.min(480, y + d[1])),
            ]);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            setMode("dot");
            dot(cursor);
          }
          if (e.key === "Escape" || e.key === " ") {
            e.preventDefault();
            end();
          }
        }}
      >
        <defs>
          <pattern
            id="w3-paper-grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M80 0H0V80"
              fill="none"
              stroke="#c7cbb8"
              strokeOpacity=".23"
            />
          </pattern>
        </defs>
        <rect width="800" height="480" fill="#fffdf5" />
        <rect width="800" height="480" fill="url(#w3-paper-grid)" />
        {!strokes.length && !draft && (
          <g fill="#667b70" textAnchor="middle" fontSize="24">
            <text x="400" y="220">
              把你想到的样子画在这里
            </text>
            <text x="400" y="260" fontSize="18">
              画好后，它会走进故事。
            </text>
          </g>
        )}
        <Ink strokes={strokes} />
        {draft && <Ink strokes={[draft]} />}
        {mode === "dot" && (
          <g>
            <circle
              cx={cursor[0]}
              cy={cursor[1]}
              r="12"
              fill="none"
              stroke="#ba4d2d"
              strokeWidth="3"
            />
            <path
              d={
                "M" +
                (cursor[0] - 18) +
                " " +
                cursor[1] +
                "h36M" +
                cursor[0] +
                " " +
                (cursor[1] - 18) +
                "v36"
              }
              stroke="#ba4d2d"
            />
          </g>
        )}
      </svg>
      <div className="w3-toolbar">
        <p>
          {mode === "pen"
            ? "按住鼠标或手指画一笔，松开就提笔。"
            : "点几下连成一笔，再点“提笔”。也可用方向键和回车。"}
        </p>
        <div>
          {(drawing || draft) && <button onClick={end}>提笔</button>}
          <button
            disabled={!strokes.length || !!draft}
            onClick={() => onChange(strokes.slice(0, -1))}
          >
            <ArrowCounterClockwise />
            撤回一笔
          </button>
          <button disabled={!strokes.length} onClick={() => setClear(!clear)}>
            <Trash />
            换张空纸
          </button>
        </div>
      </div>
      {clear && (
        <div className="w3-feedback">
          <p>这一张要重新画吗？已试过的画仍在记录里。</p>
          <button
            onClick={() => {
              end();
              onChange([]);
              setClear(false);
            }}
          >
            重新画
          </button>
          <button onClick={() => setClear(false)}>留着这张</button>
        </div>
      )}
      {strokes.length >= 60 && (
        <p role="status">这张纸已画了60笔，可以撤回一笔再画。</p>
      )}
    </section>
  );
}

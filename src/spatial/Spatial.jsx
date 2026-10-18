import React, { useEffect, useRef, useState } from "react";
import {
  ArrowsOut,
  ArrowsIn,
  ArrowCounterClockwise,
  Hand,
  Eye,
  MapTrifold,
} from "@phosphor-icons/react";

export function FullscreenButton() {
  const [full, setFull] = useState(!!document.fullscreenElement),
    [error, setError] = useState("");
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  return (
    <>
      <button
        className="sp-full"
        aria-label={full ? "退出全屏" : "全屏探索"}
        onClick={async () => {
          try {
            setError("");
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
          } catch {
            setError("这次没能打开全屏，仍可在这里继续。");
          }
        }}
      >
        {full ? <ArrowsIn /> : <ArrowsOut />}
        <span>{full ? "退出全屏" : "全屏探索"}</span>
      </button>
      {error && <span role="status">{error}</span>}
    </>
  );
}
export default function Spatial({
  kind,
  b = {},
  result = null,
  frame = 0,
  quiet = false,
  onAction,
  children,
  caption,
}) {
  const host = useRef(null),
    engine = useRef(null),
    action = useRef(onAction),
    [failed, setFailed] = useState(false),
    [flat, setFlat] = useState(false),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState("play"),
    [view, setView] = useState("angle");
  action.current = onAction;
  const latest = useRef(null);
  latest.current = { b, result, frame, quiet, mode, view };
  useEffect(() => {
    if (flat || failed) return;
    let gone = false;
    setReady(false);
    import("./world.mjs")
      .then(({ createWorld }) => {
        if (gone) return;
        engine.current = createWorld(host.current, {
          kind,
          quiet,
          onAction: (a) => action.current?.(a),
          onReady: () => setReady(true),
          onError: () => setFailed(true),
        });
        engine.current?.update?.(latest.current);
        engine.current?.mode?.(latest.current.mode);
        engine.current?.view?.(latest.current.view);
      })
      .catch(() => setFailed(true));
    return () => {
      gone = true;
      engine.current?.dispose?.();
      engine.current = null;
    };
  }, [kind, flat, failed]);
  useEffect(() => {
    engine.current?.update?.({ b, result, frame, quiet });
  }, [b, result, frame, quiet]);
  useEffect(() => {
    engine.current?.mode?.(mode);
  }, [mode]);
  useEffect(() => {
    engine.current?.view?.(view);
  }, [view]);
  return (
    <section
      className={"sp-stage sp-" + kind + (flat || failed ? " is-flat" : "")}
      aria-label="立体观察与操作"
    >
      <div className="sp-stage-tools" aria-label="观察方式">
        {!failed && (
          <button onClick={() => setFlat(!flat)} aria-pressed={flat}>
            <MapTrifold />
            {flat ? "回到立体场景" : "看平面图"}
          </button>
        )}
        {!flat && !failed && (
          <>
            <button
              aria-pressed={mode === "orbit"}
              onClick={() => setMode(mode === "play" ? "orbit" : "play")}
            >
              {mode === "play" ? <Hand /> : <Eye />}
              {mode === "play" ? "转动场景" : "回到动手操作"}
            </button>
            <button
              onClick={() => setView(view === "top" ? "angle" : "top")}
              aria-pressed={view === "top"}
            >
              {view === "top" ? "斜着看" : "从上面看"}
            </button>
            <button
              aria-label="恢复观察角度"
              onClick={() => {
                setView("angle");
                engine.current?.view?.("angle");
              }}
            >
              <ArrowCounterClockwise />
            </button>
          </>
        )}
      </div>
      {flat || failed ? (
        <div className="sp-flat">
          {failed && <p role="status">已换成平面图，画、试和记录都能继续。</p>}
          {children}
        </div>
      ) : (
        <>
          <div className="sp-world" ref={host} data-kind={kind} />
          {!ready && (
            <p className="sp-loading" role="status">
              画卷正在展开……
            </p>
          )}
        </>
      )}
      {!flat && !failed && (
        <div className="sp-stage-caption" role="status">
          {mode === "orbit"
            ? "按住空白处拖动，换个角度看。看好后，回到动手操作。"
            : caption || "点一处地方，去听听那里的故事。"}
        </div>
      )}
    </section>
  );
}

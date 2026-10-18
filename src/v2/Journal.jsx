import React, { useEffect, useState, useRef } from "react";
import { Download, ArrowsLeftRight } from "@phosphor-icons/react";
import { trialSvg, trialConditions, strokesSvg } from "./engine.mjs";
export function TrialArtwork({ kind, trial }) {
  return (
    <div
      className="v21-trial-art"
      dangerouslySetInnerHTML={{ __html: trialSvg(kind, trial) }}
    />
  );
}
export function TrialComparison({ kind, trials }) {
  const [earlier, setEarlier] = useState(Math.max(0, trials.length - 2)),
    [split, setSplit] = useState(50),
    [side, setSide] = useState(false),
    paper = useRef(null),
    dragging = useRef(false);
  const move = (e) => {
    const r = paper.current.getBoundingClientRect();
    setSplit(
      Math.max(
        0,
        Math.min(100, Math.round(((e.clientX - r.left) / r.width) * 100)),
      ),
    );
  };
  useEffect(() => {
    setEarlier(Math.max(0, trials.length - 2));
    setSplit(50);
  }, [trials]);
  const before = trials[earlier],
    after = trials.at(-1);
  if (!before || trials.length < 2) return null;
  return (
    <section className="v21-comparison" aria-label="两次试画对照">
      <div className="v21-comparison-tools">
        <label>
          找一张以前试过的画
          <select
            aria-label="以前试过的画"
            value={earlier}
            onChange={(e) => {
              setEarlier(Number(e.target.value));
              setSplit(50);
            }}
          >
            {trials.slice(0, -1).map((t, i) => (
              <option key={i} value={i}>
                第{i + 1}张记录 · {t.result.ok ? "试好了" : "还要改一改"}
              </option>
            ))}
          </select>
        </label>
        <button aria-pressed={side} onClick={() => setSide((v) => !v)}>
          <ArrowsLeftRight />
          {side ? "叠在一张纸上" : "分成两张看"}
        </button>
      </div>
      <div className="v21-compare-labels">
        <span>原来的画</span>
        <span>这一次的画</span>
      </div>
      {side ? (
        <div className="v21-comparison-pair">
          <TrialArtwork kind={kind} trial={before} />
          <TrialArtwork kind={kind} trial={after} />
        </div>
      ) : (
        <>
          <div className="v21-comparison-stack" ref={paper}>
            <TrialArtwork kind={kind} trial={after} />
            <div
              className="v21-before-layer"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
            >
              <TrialArtwork kind={kind} trial={before} />
            </div>
            <span
              className="v21-divider"
              style={{ left: split + "%" }}
              aria-hidden="true"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                dragging.current = true;
                move(e);
              }}
              onPointerMove={(e) => {
                if (dragging.current) move(e);
              }}
              onPointerUp={() => {
                dragging.current = false;
              }}
              onPointerCancel={() => {
                dragging.current = false;
              }}
            >
              <ArrowsLeftRight />
            </span>
          </div>
          <label className="v21-slider-label">
            移动分界线，看看哪一笔变了
            <input
              type="range"
              min="0"
              max="100"
              value={split}
              aria-label="两张画的分界线"
              aria-valuetext={
                split === 0
                  ? "只看这一次的画"
                  : split === 100
                    ? "只看原来的画"
                    : `左边${split}%是原来的画，右边是这一次的画`
              }
              onChange={(e) => setSplit(Number(e.target.value))}
            />
          </label>
        </>
      )}
      <div className="v21-comparison-findings">
        {[
          [before, "原来"],
          [after, "这一次"],
        ].map(([t, label]) => (
          <div key={label}>
            <strong>{label}</strong>
            <p>{t.result.message}</p>
            {kind === "river" && trialConditions(t) && (
              <p className="v21-prep-record">{trialConditions(t)}</p>
            )}
          </div>
        ))}
      </div>
      <p className="v21-say">
        先看看画，再看看准备。和伙伴说一说：我改了哪里？结果有什么不同？
      </p>
    </section>
  );
}
export default function Journal({ s, initialKind = "canopy", saveFile }) {
  const [kind, setKind] = useState(initialKind),
    [compare, setCompare] = useState(false),
    record = s[kind];
  const title = kind === "canopy" ? "雨夜的伞" : "我画的水路";
  const current = {
    strokes: record.strokes,
    result: record.result,
    ...(kind === "river"
      ? {
          conditions: {
            support: record.support,
            power: record.power,
            bridge: record.bridge,
          },
        }
      : {}),
  };
  return (
    <div className="v2-album v21-journal">
      <div className="v21-album-tabs" role="group" aria-label="翻哪一本画册">
        {[
          ["canopy", "雨夜的伞"],
          ["river", "我画的水路"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={kind === id}
            onClick={() => {
              setKind(id);
              setCompare(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <section>
        <div className="v21-journal-heading">
          <h3>{title}</h3>
          <div role="group" aria-label="怎样看这幅画">
            <button aria-pressed={!compare} onClick={() => setCompare(false)}>
              看看现在的画
            </button>
            <button
              aria-pressed={compare}
              disabled={record.tests.length < 2}
              onClick={() => setCompare(true)}
            >
              两次放一起
            </button>
          </div>
        </div>
        {compare ? (
          <TrialComparison kind={kind} trials={record.tests} />
        ) : (
          <>
            <TrialArtwork kind={kind} trial={current} />
            <p className="v21-current-result">
              {record.result?.message || "这张画还等着试一试。"}
            </p>
            <button
              disabled={!record.strokes.length}
              onClick={() =>
                saveFile(
                  title + ".svg",
                  strokesSvg(record.strokes),
                  "image/svg+xml",
                )
              }
            >
              <Download />
              保存这张画
            </button>
            {record.tests.length < 2 && (
              <p className="v2-small">试过两次，就能把两张画放在一起看。</p>
            )}
          </>
        )}
        {record.tests.length > 0 && (
          <details>
            <summary>翻看试过的画（{record.tests.length}张）</summary>
            {record.tests.map((t, i) => (
              <figure key={i}>
                <strong>第{i + 1}张记录</strong>
                <TrialArtwork kind={kind} trial={t} />
                <figcaption>
                  {t.result.message}
                  {kind === "river" && trialConditions(t) && (
                    <span className="v21-history-prep">
                      {trialConditions(t)}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </details>
        )}
      </section>
    </div>
  );
}

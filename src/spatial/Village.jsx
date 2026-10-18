import React from "react";
import Spatial from "./Spatial.jsx";
import { STORIES, chapterRecord } from "../v3/model.mjs";
import { ArrowRight, Check } from "@phosphor-icons/react";
export default function Village({
  w,
  water,
  go,
  quiet,
  heading,
  stories = STORIES,
}) {
  return (
    <main className="sp-village">
      <div className="sp-village-title">
        <span>神笔马良 · 奇幻一笔</span>
        <h1 ref={heading} tabIndex={-1}>
          拿起神笔，
          <br />
          走进故事。
        </h1>
        <p>
          田里、磨坊和海边，都有人盼着一个好办法。
          <br />
          选一处出发，让你画的东西派上用场。
        </p>
      </div>
      <Spatial
        kind="map"
        quiet={quiet}
        onAction={(a) => {
          if (a.type === "story") go(a.id);
        }}
        caption="点村中的名字，或从下面选一段故事。"
      >
        <img
          className="sp-village-fallback"
          src="/assets/shared-board-v1.png"
          alt="马良、小禾和村民一起商量办法"
        />
      </Spatial>
      <section className="sp-chapters" aria-label="选择故事">
        <div className="sp-chapters-heading">
          <span>想先去哪里？</span>
          <small>每章都能单独探索 · 进度自动留下</small>
        </div>
        <div className="w3-story-books">
          {stories.map((s, i) => {
            const r = chapterRecord(s.id, w, water);
            return (
              <button
                key={s.id}
                className={"w3-story-book story-" + s.id}
                onClick={() => go(s.id)}
              >
                <img src={"/assets/" + s.image} alt="" />
                <div>
                  <small>
                    {["壹 · 溪边", "贰 · 田间", "叁 · 磨坊", "肆 · 海上"][i]}
                    {r.closed && <Check />}
                  </small>
                  <h2>{s.title}</h2>
                  <span>{s.tag}</span>
                  <b>
                    {r.closed ? "再进故事" : "翻开这一章"}
                    <ArrowRight />
                  </b>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

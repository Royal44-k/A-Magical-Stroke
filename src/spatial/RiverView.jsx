import React, { useEffect, useRef, useState } from "react";
import Spatial from "./Spatial.jsx";
import { Artwork } from "../v2/PaintBoard.jsx";
export default function RiverView({ river, quiet }) {
  const [open, setOpen] = useState(false),
    ref = useRef(null);
  useEffect(() => {
    if (open) {
      const prev = document.activeElement;
      ref.current.showModal();
      return () => prev?.focus?.();
    }
  }, [open]);
  return (
    <div className="sp-river-entry">
      <button onClick={() => setOpen(true)}>走进我的水路图</button>
      <span>把刚画的水路立起来，看看田地和门前。</span>
      {open && (
        <dialog
          ref={ref}
          className="sp-river-dialog"
          onCancel={() => setOpen(false)}
        >
          <header>
            <div>
              <small>一笔清泉 · 看看我的办法</small>
              <h2>水会流到哪里？</h2>
            </div>
            <button onClick={() => setOpen(false)}>回到画纸，接着改</button>
          </header>
          <Spatial
            kind="water"
            b={river}
            result={river.result}
            quiet={quiet}
            caption={
              river.result
                ? river.result.message
                : "水路已画出来。回到画纸试水后，才能看见水流。"
            }
          >
            <Artwork strokes={river.strokes} kind="river" />
          </Spatial>
          <p>
            深色线是你的笔迹，亮蓝色是这次试水走过的地方。没有接到水源的线，不会凭空出水。
          </p>
        </dialog>
      )}
    </div>
  );
}

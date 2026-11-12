// Scrub timeline for the full-screen project viewer: one bar per project, grouped by year.
// Grab anywhere and slide to jump through all 94; bars swell around the cursor (or the current project).
// Keyboard: Home and End jump to the ends, Page Up and Page Down move ten; the arrows stay with the viewer.
import React, { useMemo, useRef, useState } from 'react';

const GAP = 1.6; // empty slots between years
const TYPES = ['', 'case', 'lab', 'nda'];

export default function Scrubber({ rows, sel, onPick }) {
  const ref = useRef(null);
  const drag = useRef(false);
  const [hover, setHover] = useState(null);

  const { xs, years } = useMemo(() => {
    const out = [], ys = [];
    let slot = 0, last = null;
    rows.forEach((d, i) => {
      if (last !== null && d[0] !== last) slot += GAP;
      if (d[0] !== last) ys.push({ i, y: d[0] });
      out.push(slot);
      slot += 1;
      last = d[0];
    });
    const span = slot - 1 || 1;
    return { xs: out.map((s) => s / span), years: ys.map((g) => ({ ...g, x: out[g.i] / span })) };
  }, [rows]);

  const at = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    let best = 0;
    xs.forEach((x, i) => { if (Math.abs(x - f) < Math.abs(xs[best] - f)) best = i; });
    return { f, i: best };
  };
  const go = (i) => { if (i !== sel) onPick(i); };

  const down = (e) => {
    e.stopPropagation();
    drag.current = true;
    ref.current.setPointerCapture(e.pointerId);
    const p = at(e.clientX);
    setHover(p);
    go(p.i);
  };
  const move = (e) => {
    const p = at(e.clientX);
    setHover(p);
    if (drag.current) go(p.i);
  };
  const up = (e) => { e.stopPropagation(); drag.current = false; if (e.pointerType !== 'mouse') setHover(null); };
  const key = (e) => {
    const n = rows.length, cur = sel || 0;
    const to = { Home: 0, End: n - 1, PageUp: Math.max(0, cur - 10), PageDown: Math.min(n - 1, cur + 10) }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setHover(null);
    go(to);
  };

  const cur = sel || 0;
  const focus = hover === null ? xs[cur] : hover.f;
  const show = hover === null ? cur : hover.i;
  const name = (d) => (d[4] === 3 ? 'Under NDA' : d[5]);
  const tip = rows[show];

  return (
    <div className="sx" onPointerLeave={() => { if (!drag.current) setHover(null); }}>
      <div className="sx-tip" style={{ '--f': focus.toFixed(4) }} aria-hidden="true">
        <b>{2013 + tip[0]}</b> {name(tip)}
      </div>
      <div
        className="sx-track"
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Project timeline"
        aria-valuemin={1}
        aria-valuemax={rows.length}
        aria-valuenow={cur + 1}
        aria-valuetext={(cur + 1) + ' of ' + rows.length + ': ' + name(rows[cur]) + ', ' + (2013 + rows[cur][0])}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        {rows.map((d, i) => {
          const dx = (xs[i] - focus) / 0.045;
          const swell = Math.exp(-dx * dx);
          return (
            <i
              key={i}
              className={[TYPES[d[4]], i === cur ? 'on' : i < cur ? 'past' : ''].join(' ')}
              style={{ left: xs[i] * 100 + '%', height: (12 + 34 * swell + (i === cur ? 10 : 0)).toFixed(1) + 'px' }}
            />
          );
        })}
        <span className="sx-head" style={{ left: xs[cur] * 100 + '%' }} aria-hidden="true" />
      </div>
      <div className="sx-years" aria-hidden="true">
        {years.map((g) => <span key={g.y} style={{ left: g.x * 100 + '%' }}>{"'" + String(13 + g.y).padStart(2, '0')}</span>)}
      </div>
    </div>
  );
}

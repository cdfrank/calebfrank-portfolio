// Full-screen project viewer for phones and tablets, shared by the home map and the Work record.
// The next/previous arrows sit up top, under the header; the year histogram (Scrubber) sits at the bottom,
// in the thumb zone, so the control people grab and slide is the one closest to the thumb.
import React from 'react';
import { createPortal } from 'react-dom';
import Scrubber from './Scrubber.jsx';

export default function Viewer({ label, ox, oy, kicker, count, rows, sel, onPick, onClose, onPrev, onNext, backLabel, closeLabel, closeRef, bodyKey, onPointerDown, onPointerUp, children }) {
  return createPortal(
    <div className={"sr srx"} role={"dialog"} aria-modal={"true"} aria-label={label} style={{ "--ox": ox, "--oy": oy }} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <header className={"srx-top"}>
        <span className={"yr"}>{kicker}</span>
        <span className={"srx-n"}>{count}</span>
        <button className={"srx-x"} ref={closeRef} onClick={onClose} aria-label={closeLabel}><span aria-hidden={"true"}>{"×"}</span></button>
      </header>
      <nav className={"srx-nav"} aria-label={"Projects"}>
        <button onClick={onPrev} aria-label={"Previous project"}><span aria-hidden={"true"}>{"←"}</span></button>
        <button className={"srx-back"} onClick={onClose}>{backLabel}</button>
        <button onClick={onNext} aria-label={"Next project"}><span aria-hidden={"true"}>{"→"}</span></button>
      </nav>
      <div className={"srx-body"} key={bodyKey} aria-live={"polite"}>
        {children}
      </div>
      <Scrubber rows={rows} sel={sel} onPick={onPick} />
    </div>,
    document.body
  );
}

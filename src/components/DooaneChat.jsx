import { useEffect, useRef, useState } from 'react';
import { answerQuestion, greeting, suggestions } from '../lib/dooane.mjs';
import '../styles/dooane.css';

function Mascot({ state = 'idle', small = false, onWaveEnd }) {
  return <span className={`dooane-sprite dooane-sprite-${state}${small ? ' dooane-sprite-small' : ''}`} aria-hidden="true" onAnimationEnd={state === 'waving' ? onWaveEnd : undefined} />;
}

function Arrow() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 14 0m-6-6 6 6-6 6" /></svg>; }

export default function DooaneChat({ portfolio }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ ...greeting, role: 'assistant' }]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const [keys, setKeys] = useState(false);
  const launcher = useRef(null);
  const panel = useRef(null);
  const input = useRef(null);
  const transcript = useRef(null);
  const pending = useRef(null);

  useEffect(() => () => clearTimeout(pending.current), []);
  // Touch screens: opening the guide must not summon the keyboard. The field takes focus only when the visitor taps it.
  useEffect(() => {
    if (!open) return;
    const typist = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    (typist ? input : panel).current?.focus({ preventScroll: true });
  }, [open]);
  // Phones: the guide is a full-screen sheet sized to the visible viewport, so the header and the field stay in view above the keyboard.
  useEffect(() => {
    if (!open) return;
    const phone = window.matchMedia('(max-width: 520px)');
    const view = window.visualViewport;
    const root = document.documentElement;
    const fit = () => {
      const box = panel.current;
      if (!box) return;
      const sheet = phone.matches && view && view.scale < 1.05;
      root.style.overflow = phone.matches ? 'hidden' : '';
      if (sheet) { box.style.setProperty('--dooane-top', `${view.offsetTop}px`); box.style.setProperty('--dooane-h', `${view.height}px`); }
      else { box.style.removeProperty('--dooane-top'); box.style.removeProperty('--dooane-h'); }
      setKeys(Boolean(sheet) && window.innerHeight - view.height > 120);
    };
    fit();
    phone.addEventListener('change', fit);
    view?.addEventListener('resize', fit);
    view?.addEventListener('scroll', fit);
    return () => {
      phone.removeEventListener('change', fit);
      view?.removeEventListener('resize', fit);
      view?.removeEventListener('scroll', fit);
      root.style.overflow = '';
      setKeys(false);
    };
  }, [open]);
  useEffect(() => {
    const box = transcript.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, busy, open, keys]);

  function close() { setHover(false); setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); }
  function ask(value) {
    const question = value.trim().slice(0, 400);
    if (!question || pending.current !== null) return;
    // Keep typing where the visitor was typing; a tapped suggestion leaves the keyboard down.
    const typing = document.activeElement === input.current || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setMessages((history) => [...history.slice(-27), { role: 'user', text: question, links: [] }]);
    setDraft('');
    setBusy(true);
    // Brief animation gives the visitor visible feedback; replies are local and prepared.
    pending.current = setTimeout(() => {
      pending.current = null;
      setMessages((history) => [...history, { role: 'assistant', ...answerQuestion(question, portfolio) }]);
      setBusy(false);
      (typing ? input : panel).current?.focus({ preventScroll: true });
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420);
  }

  return <aside className="dooane-widget" aria-label="DOOANE portfolio guide">
    {open && <section className={`dooane-panel${keys ? ' dooane-panel-keys' : ''}`} id="dooane-chat" ref={panel} tabIndex={-1} role="dialog" aria-label="Chat with DOOANE" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header className="dooane-head">
        <div className="dooane-head-art"><Mascot small state={busy ? 'thinking' : 'idle'} /></div>
        <div><span className="dooane-eyebrow">YOUR INSIDE GUIDE</span><h2>ASK DOOANE<span>.</span></h2><p>Caleb’s work. A little personality.</p></div>
        <button className="dooane-close" aria-label="Close chat" onClick={close}><span aria-hidden="true">×</span></button>
      </header>
      <div className="dooane-transcript" ref={transcript} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
        {messages.map((message, index) => <div key={index} className={`dooane-message dooane-message-${message.role}`}>
          <span className="dooane-speaker">{message.role === 'assistant' ? 'DOOANE' : 'YOU'}</span>
          <p>{message.text}</p>
          {message.links?.length > 0 && <div className="dooane-answer-links">{message.links.map(({ label, href }) => <a key={`${href}-${label}`} href={href}>{label}<Arrow /></a>)}</div>}
        </div>)}
        {busy && <p className="dooane-thinking" role="status">Finding your next stop…</p>}
      </div>
      <div className="dooane-suggestions" aria-label="Suggested questions">{suggestions.map((question) => <button key={question} disabled={busy} onClick={() => ask(question)}>{question}</button>)}</div>
      <form className="dooane-form" onSubmit={(event) => { event.preventDefault(); ask(draft); }}>
        <label className="dooane-sr" htmlFor="dooane-question">Ask about Caleb’s portfolio</label>
        <input id="dooane-question" ref={input} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={400} placeholder="Ask about a project or skill…" autoComplete="off" enterKeyHint="send" />
        <button type="submit" disabled={!draft.trim() || busy} aria-label="Send question"><Arrow /></button>
      </form>
      <p className="dooane-note">A guided tour, powered by the published portfolio.</p>
    </section>}
    <button className={`dooane-launcher${open ? ' dooane-launcher-open' : ''}`} ref={launcher} aria-label={open ? 'Close DOOANE portfolio guide' : 'Ask DOOANE about Caleb’s portfolio'} aria-expanded={open} aria-controls={open ? 'dooane-chat' : undefined} onClick={() => { setHover(false); open ? close() : setOpen(true); }} onPointerEnter={(event) => { if (event.pointerType !== 'touch' && !open) setHover(true); }}>
      <span className="dooane-launcher-label">{open ? 'CLOSE CHAT' : 'ASK DOOANE'}<span aria-hidden="true">{open ? '×' : '↗'}</span></span>
      <Mascot state={open ? 'waiting' : hover ? 'waving' : 'idle'} onWaveEnd={() => setHover(false)} />
    </button>
  </aside>;
}

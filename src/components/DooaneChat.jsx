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
  const launcher = useRef(null);
  const input = useRef(null);
  const transcript = useRef(null);
  const pending = useRef(null);

  useEffect(() => () => clearTimeout(pending.current), []);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    const box = transcript.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, busy, open]);

  function close() { setHover(false); setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); }
  function ask(value) {
    const question = value.trim().slice(0, 400);
    if (!question || pending.current !== null) return;
    setMessages((history) => [...history.slice(-27), { role: 'user', text: question, links: [] }]);
    setDraft('');
    setBusy(true);
    // Brief animation gives the visitor visible feedback; replies are local and prepared.
    pending.current = setTimeout(() => {
      pending.current = null;
      setMessages((history) => [...history, { role: 'assistant', ...answerQuestion(question, portfolio) }]);
      setBusy(false);
      input.current?.focus();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420);
  }

  return <aside className="dooane-widget" aria-label="DOOANE portfolio guide">
    {open && <section className="dooane-panel" id="dooane-chat" role="dialog" aria-label="Chat with DOOANE" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
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

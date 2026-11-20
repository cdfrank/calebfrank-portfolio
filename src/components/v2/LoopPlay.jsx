// Coded preview loop for the full-screen viewer: plays the project's loop from the top,
// or holds its poster frame for reduced-motion visitors.
import React, { useEffect, useRef } from 'react';
import { load } from './LoopThumb.jsx';

export default function LoopPlay({ slug }) {
  const ref = useRef(null);
  useEffect(() => {
    const box = ref.current;
    if (!box || !slug) return undefined;
    let alive = true;
    box.innerHTML = '';
    load(slug).then((markup) => {
      if (!alive || !markup) return;
      box.innerHTML = markup;
      const svg = box.querySelector('svg.hl');
      if (!svg) return;
      svg.removeAttribute('role');
      svg.setAttribute('aria-hidden', 'true');
      if (!svg.getAnimations) return;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t = parseFloat(svg.dataset.poster || '5') * 1000;
      svg.classList.add('hl-js');
      svg.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = still ? t : 0; if (still) a.pause(); else a.play(); });
    });
    return () => { alive = false; };
  }, [slug]);
  return <div className="srx-pv" ref={ref} aria-hidden="true" />;
}

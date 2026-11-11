// Hover loop thumbnail for a record row. The SVG loads only when the row nears the screen,
// rests on its still frame, and plays from the top on hover or focus (or when in view on touch screens).
// Reduced-motion visitors only ever see the still frame.
import React, { useEffect, useRef } from 'react';

const cache = new Map();
const load = (slug) => {
  if (!cache.has(slug)) cache.set(slug, fetch(`/loops/${slug}.svg`).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  return cache.get(slug);
};

const anims = (svg) => (svg && svg.getAnimations ? svg.getAnimations({ subtree: true }) : []);
const rest = (svg) => {
  const t = parseFloat(svg.dataset.poster || '5') * 1000;
  anims(svg).forEach((a) => { a.pause(); a.currentTime = t; });
  svg.dataset.state = 'rest';
};
const play = (svg) => {
  if (svg.dataset.state === 'play') return;
  anims(svg).forEach((a) => { a.currentTime = 0; a.play(); });
  svg.dataset.state = 'play';
};

export default function LoopThumb({ slug }) {
  const ref = useRef(null);

  useEffect(() => {
    const box = ref.current;
    if (!box || !slug) return undefined;
    let alive = true;
    const cleanups = [];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    box.innerHTML = '';

    const mount = (markup) => {
      if (!alive || !markup) return;
      box.innerHTML = markup;
      const svg = box.querySelector('svg.hl');
      if (!svg || !svg.getAnimations) return;
      svg.removeAttribute('role');
      svg.classList.add('hl-js');
      rest(svg);
      if (reduce) return;
      const host = box.closest('li') || box;
      if (canHover) {
        const on = () => play(svg), off = () => rest(svg);
        host.addEventListener('mouseenter', on);
        host.addEventListener('mouseleave', off);
        host.addEventListener('focusin', on);
        host.addEventListener('focusout', off);
        cleanups.push(() => {
          host.removeEventListener('mouseenter', on);
          host.removeEventListener('mouseleave', off);
          host.removeEventListener('focusin', on);
          host.removeEventListener('focusout', off);
        });
      } else {
        const io = new IntersectionObserver((es) => es.forEach((e) => (e.intersectionRatio >= 0.75 ? play(svg) : rest(svg))), { threshold: [0, 0.75, 1] });
        io.observe(box);
        cleanups.push(() => io.disconnect());
      }
    };

    const near = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        near.disconnect();
        load(slug).then(mount);
      }
    }, { rootMargin: '400px 0px' });
    near.observe(box);
    cleanups.push(() => near.disconnect());

    return () => {
      alive = false;
      cleanups.forEach((f) => f());
    };
  }, [slug]);

  return <span className="rthumb" ref={ref} aria-hidden="true" />;
}

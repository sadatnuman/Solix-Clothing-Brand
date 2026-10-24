'use client';

import { useRef } from 'react';

export default function DepthScene({ children, className = '' }) {
  const ref = useRef(null);

  function handlePointerMove(event) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    ref.current?.style.setProperty('--scene-rx', `${-y * 8}deg`);
    ref.current?.style.setProperty('--scene-ry', `${x * 11}deg`);
    ref.current?.style.setProperty('--scene-x', `${x * 14}px`);
    ref.current?.style.setProperty('--scene-y', `${y * 12}px`);
  }

  function reset() {
    ref.current?.style.setProperty('--scene-rx', '0deg');
    ref.current?.style.setProperty('--scene-ry', '0deg');
    ref.current?.style.setProperty('--scene-x', '0px');
    ref.current?.style.setProperty('--scene-y', '0px');
  }

  return <div ref={ref} className={`depth-scene ${className}`} onPointerMove={handlePointerMove} onPointerLeave={reset}>{children}</div>;
}

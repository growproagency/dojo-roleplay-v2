import { useEffect, useRef } from 'react';
import {
  SCENE_W, SCENE_H, buildStaticDrawables, createStaticLayer, createWorld, renderScene, stepWorld,
} from './pixelScene';

// Canvas wrapper for the pixel-art dojo. Props are read through a ref so the
// animation loop never restarts when call state changes.
export function DojoScene({ context, phase, speaker, volumeRef, emote, zoom = 'auto', callerLook, className = '' }) {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  inputRef.current = { context, phase, speaker, volumeRef, emote, zoom, callerLook };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const world = createWorld();
    const staticLayer = createStaticLayer();
    const staticDrawables = buildStaticDrawables();
    let last = performance.now();
    let raf = 0;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepWorld(world, inputRef.current, dt, now / 1000, reducedMotion);
      renderScene(ctx, staticLayer, staticDrawables, world, now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={SCENE_W}
      height={SCENE_H}
      role="img"
      aria-label="Pixel-art dojo showing the practice caller and the staff member"
      className={`block w-full ${className}`}
      style={{ imageRendering: 'pixelated', aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
    />
  );
}

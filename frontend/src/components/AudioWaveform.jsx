import { useEffect, useRef, useState } from 'react';

const BARS = [9, 10, 10, 11, 12, 13, 14, 16, 18, 22, 26, 32, 40, 52, 64, 78, 88, 78, 64, 52, 40, 32, 26, 22, 18, 16, 14, 13, 12, 11, 10, 10, 9];
const CENTER_INDEX = Math.floor(BARS.length / 2);
const MIN_LEVEL = 12;

export function AudioWaveform({ active = true, reactive = false, speed = 'normal' }) {
  const [levels, setLevels] = useState(null);
  const frameRef = useRef(null);
  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const duration = speed === 'fast' ? '820ms' : '1.35s';

  useEffect(() => {
    if (!active || !reactive) {
      setLevels(null);
      return undefined;
    }

    let cancelled = false;

    async function startMicMeter() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);

        streamRef.current = stream;
        contextRef.current = context;

        const data = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          const rms = Math.sqrt(
            data.reduce((sum, value) => {
              const normalized = (value - 128) / 128;
              return sum + normalized * normalized;
            }, 0) / data.length
          );
          const volume = Math.min(1, rms * 8);

          const nextLevels = BARS.map((base, index) => {
            const distanceFromCenter = Math.abs(index - CENTER_INDEX);
            const centerWeight = 1 - Math.min(0.78, distanceFromCenter / CENTER_INDEX);
            const lift = volume * 86 * centerWeight;
            return Math.max(MIN_LEVEL, Math.min(96, Math.round(base * 0.35 + lift)));
          });

          setLevels(nextLevels);
          frameRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch {
        setLevels(null);
      }
    }

    startMicMeter();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      contextRef.current?.close().catch(() => {});
      contextRef.current = null;
      setLevels(null);
    };
  }, [active, reactive]);

  const isMetering = active && reactive && levels;

  return (
    <div className="mx-auto flex h-20 w-full max-w-[620px] items-center justify-center gap-1.5" aria-hidden="true">
      {BARS.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-1.5 rounded-full bg-primary/70 transition-all duration-75 dark:bg-primary/80 ${
            active && !isMetering ? 'animate-audio-wave opacity-100' : active ? 'opacity-100' : 'opacity-35'
          }`}
          style={{
            height: `${isMetering ? levels[index] : height}%`,
            animationDelay: `${index * 70}ms`,
            animationDuration: duration,
          }}
        />
      ))}
    </div>
  );
}

import { useCallback, useEffect, useReducer, useRef } from 'react';

// Shared in-call state for the V3 lab. The simulated and live hooks both
// produce this shape, so the scene and widgets do not care which one is driving.

export const initialSession = {
  phase: 'idle', // idle | connecting | active | ended
  speaker: null, // 'staff' | 'caller' | null
  captions: [],
  stage: 0,
  revealed: [],
  warmth: 50,
  objection: null, // { label, resolved }
  cue: null,
  emote: null, // { who, id, key }
  talkMs: { staff: 0, caller: 0 },
  staffStreakMs: 0,
  elapsedMs: 0,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const nextEmote = (state, who, id) => ({ who, id, key: (state.emote?.key ?? 0) + 1 });

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return { ...initialSession, phase: action.phase ?? 'idle' };
    case 'phase':
      return { ...state, phase: action.phase, speaker: action.phase === 'active' ? state.speaker : null, cue: null };
    case 'speaker':
      return state.speaker === action.who ? state : { ...state, speaker: action.who };
    case 'caption': {
      const last = state.captions[state.captions.length - 1];
      const entry = { who: action.who, text: action.text, final: !!action.final };
      const captions = last && last.who === action.who && !last.final
        ? [...state.captions.slice(0, -1), entry]
        : [...state.captions, entry];
      return { ...state, captions: captions.slice(-6) };
    }
    case 'stage':
      return { ...state, stage: action.index };
    case 'reveal':
      return state.revealed.includes(action.id) ? state : { ...state, revealed: [...state.revealed, action.id] };
    case 'warmth': {
      const warmth = clamp(state.warmth + action.delta, 0, 100);
      const emote = Math.abs(action.delta) >= 8
        ? nextEmote(state, 'caller', action.delta > 0 ? 'heart' : 'sweat')
        : state.emote;
      return { ...state, warmth, emote };
    }
    case 'objection':
      return { ...state, objection: { label: action.label, resolved: false } };
    case 'resolveObjection':
      return state.objection ? { ...state, objection: { ...state.objection, resolved: true } } : state;
    case 'cue':
      return { ...state, cue: action.text };
    case 'emote':
      return { ...state, emote: nextEmote(state, action.who, action.id) };
    case 'tick': {
      if (state.phase !== 'active') return state;
      const talkMs = state.speaker
        ? { ...state.talkMs, [state.speaker]: state.talkMs[state.speaker] + action.dt }
        : state.talkMs;
      return {
        ...state,
        talkMs,
        elapsedMs: state.elapsedMs + action.dt,
        staffStreakMs: state.speaker === 'staff' ? state.staffStreakMs + action.dt : 0,
      };
    }
    default:
      return state;
  }
}

const TICK_MS = 150;

// Plays a scripted call on timers. Costs nothing and needs no microphone.
export function useSimulatedCall(script, speed) {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const volumeRef = useRef(0);
  const run = useRef({ timers: [], tick: null, line: null, lastTick: 0 });
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const stopTimers = useCallback(() => {
    run.current.timers.forEach(clearTimeout);
    clearInterval(run.current.tick);
    run.current = { timers: [], tick: null, line: null, lastTick: 0 };
    volumeRef.current = 0;
  }, []);

  const later = useCallback((ms, fn) => {
    run.current.timers.push(setTimeout(fn, ms / speedRef.current));
  }, []);

  const end = useCallback(() => {
    stopTimers();
    dispatch({ type: 'phase', phase: 'ended' });
  }, [stopTimers]);

  const playStep = useCallback((index) => {
    const step = script.steps[index];
    if (!step) {
      end();
      return;
    }
    if (step.stage != null) dispatch({ type: 'stage', index: step.stage });
    if (step.reveal) dispatch({ type: 'reveal', id: step.reveal });
    if (step.objection) dispatch({ type: 'objection', label: step.objection });
    if (step.resolve) dispatch({ type: 'resolveObjection' });
    if (step.emote) dispatch({ type: 'emote', ...step.emote });
    if (step.warmth) dispatch({ type: 'warmth', delta: step.warmth });

    if (step.who === 'cue') {
      dispatch({ type: 'speaker', who: null });
      dispatch({ type: 'cue', text: step.text });
      later(step.hold ?? 2500, () => {
        dispatch({ type: 'cue', text: null });
        playStep(index + 1);
      });
      return;
    }

    const words = step.text.split(/\s+/);
    const duration = clamp(words.length * 300, 1400, 13000);
    run.current.line = { who: step.who, words, startedAt: performance.now(), duration: duration / speedRef.current };
    dispatch({ type: 'speaker', who: step.who });
    later(duration, () => {
      run.current.line = null;
      dispatch({ type: 'caption', who: step.who, text: step.text, final: true });
      dispatch({ type: 'speaker', who: null });
      later(450, () => playStep(index + 1));
    });
  }, [end, later, script]);

  const start = useCallback(() => {
    stopTimers();
    dispatch({ type: 'reset', phase: 'connecting' });
    run.current.lastTick = performance.now();
    run.current.tick = setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'tick', dt: (now - run.current.lastTick) * speedRef.current });
      run.current.lastTick = now;
      const { line } = run.current;
      volumeRef.current = line ? 0.3 + Math.random() * 0.7 : 0;
      if (line) {
        const shown = Math.ceil(clamp((now - line.startedAt) / line.duration, 0.05, 1) * line.words.length);
        dispatch({ type: 'caption', who: line.who, text: line.words.slice(0, shown).join(' ') });
      }
    }, TICK_MS);
    later(script.context === 'in_person' ? 3000 : 2400, () => {
      dispatch({ type: 'phase', phase: 'active' });
      playStep(0);
    });
  }, [later, playStep, script, stopTimers]);

  // Stop cleanly when the script changes or the page unmounts.
  useEffect(() => () => {
    stopTimers();
    dispatch({ type: 'reset' });
  }, [script, stopTimers]);

  return { state, dispatch, volumeRef, start, end };
}

// Drives the same state from a real Vapi web call, using the window events
// emitted by CallWidget. Only what the browser can observe is available here:
// who is speaking, volume and captions. Stage, discovery and warmth need the
// AI to report them, so in live mode they only move via the test triggers.
export function useLiveCall(script, difficulty) {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const volumeRef = useRef(0);
  const flags = useRef({ engaged: false, assistant: false, user: false, userTimer: null });

  useEffect(() => {
    const syncSpeaker = () => {
      const f = flags.current;
      dispatch({ type: 'speaker', who: f.assistant ? 'caller' : f.user ? 'staff' : null });
    };
    const setUserSpeaking = (speaking) => {
      const f = flags.current;
      clearTimeout(f.userTimer);
      f.user = speaking;
      if (speaking) f.userTimer = setTimeout(() => { f.user = false; syncSpeaker(); }, 1500);
      syncSpeaker();
    };

    const onState = (event) => {
      const f = flags.current;
      if (!f.engaged) return;
      const status = event.detail?.status;
      if (status === 'connecting') dispatch({ type: 'reset', phase: 'connecting' });
      else if (status === 'active') dispatch({ type: 'phase', phase: 'active' });
      else {
        f.engaged = false;
        f.assistant = false;
        f.user = false;
        clearTimeout(f.userTimer);
        volumeRef.current = 0;
        dispatch({ type: 'phase', phase: 'ended' });
      }
    };

    const onActivity = (event) => {
      const f = flags.current;
      const detail = event.detail ?? {};
      if (!f.engaged) return;
      if (detail.type === 'assistant-speech') {
        f.assistant = !!detail.speaking;
        syncSpeaker();
      } else if (detail.type === 'volume') {
        volumeRef.current = f.assistant ? Number(detail.level) || 0 : f.user ? 0.7 : 0;
      } else if (detail.type === 'speech-update' && detail.role === 'user') {
        setUserSpeaking(!!detail.speaking);
      } else if (detail.type === 'transcript' && detail.text) {
        const who = detail.role === 'user' ? 'staff' : 'caller';
        dispatch({ type: 'caption', who, text: detail.text, final: detail.final });
        if (who === 'staff') setUserSpeaking(!detail.final);
      }
    };

    window.addEventListener('dojo:call-state', onState);
    window.addEventListener('dojo:call-activity', onActivity);
    return () => {
      window.removeEventListener('dojo:call-state', onState);
      window.removeEventListener('dojo:call-activity', onActivity);
      clearTimeout(flags.current.userTimer);
    };
  }, []);

  useEffect(() => {
    if (state.phase !== 'active') return undefined;
    let last = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'tick', dt: now - last });
      last = now;
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [state.phase]);

  const start = useCallback(() => {
    flags.current.engaged = true;
    window.dispatchEvent(new CustomEvent('dojo:start-call', {
      detail: { scenario: script.liveScenario, scenarioTitle: script.title, difficulty },
    }));
  }, [difficulty, script]);

  const end = useCallback(() => window.dispatchEvent(new Event('dojo:end-call')), []);

  const setMuted = useCallback((muted) => {
    window.dispatchEvent(new CustomEvent('dojo:set-muted', { detail: { muted } }));
  }, []);

  return { state, dispatch, volumeRef, start, end, setMuted };
}

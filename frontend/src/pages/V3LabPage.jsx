import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FlaskConical, Mic, MicOff, Phone, PhoneOff, Play, RotateCcw, Users } from 'lucide-react';
import { DojoScene } from '../features/v3lab/DojoScene';
import { EMOTE_IDS } from '../features/v3lab/pixelScene';
import { DEMO_SCRIPTS } from '../features/v3lab/demoScripts';
import { useLiveCall, useSimulatedCall } from '../features/v3lab/useCallSession';
import {
  Captions, CueBanner, DiscoveryBoard, ObjectionCard, StageTracker, TalkBalance, WarmthMeter, formatClock,
} from '../features/v3lab/CallHud';

// Shortened from the ~30s we would ship, so the nudge is easy to see in a demo.
const NUDGE_AFTER_MS = 8000;

const SCENE_PHASE = { idle: 'idle', connecting: 'arriving', active: 'active', ended: 'leaving' };

const WIDGETS = [
  { id: 'stage', label: 'Stage tracker' },
  { id: 'captions', label: 'Live captions' },
  { id: 'cues', label: 'Coaching cues' },
  { id: 'discovery', label: 'Discovery board' },
  { id: 'warmth', label: 'Warmth meter' },
  { id: 'talk', label: 'Talk time' },
  { id: 'objection', label: 'Objection card' },
];

const CONTEXT_LABELS = { in_person: 'In person', inbound_call: 'Inbound call', outbound_callback: 'Outbound callback' };

function Segmented({ label, options, value, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-secondary/30 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              value === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function V3LabPage() {
  const [mode, setMode] = useState('sim');
  const [scriptId, setScriptId] = useState(DEMO_SCRIPTS[0].id);
  const [speed, setSpeed] = useState(1);
  const [difficulty, setDifficulty] = useState('medium');
  const [zoom, setZoom] = useState('auto');
  const [muted, setMuted] = useState(false);
  const [widgets, setWidgets] = useState(() => Object.fromEntries(WIDGETS.map((w) => [w.id, true])));
  const cueTimer = useRef(null);

  const script = DEMO_SCRIPTS.find((item) => item.id === scriptId) ?? DEMO_SCRIPTS[0];
  const sim = useSimulatedCall(script, speed);
  const live = useLiveCall(script, difficulty);
  const isLive = mode === 'live';
  const session = isLive ? live : sim;
  const { state, dispatch } = session;

  const connecting = state.phase === 'connecting';
  const active = state.phase === 'active';
  const busy = connecting || active;
  const callerName = script.caller.name;
  const ContextIcon = script.context === 'in_person' ? Users : Phone;
  const cue = state.cue || (active && state.staffStreakMs > NUDGE_AFTER_MS ? 'Let them respond' : null);
  const simOnlyNote = isLive ? 'Simulated - use test triggers' : undefined;

  useEffect(() => {
    if (!active) setMuted(false);
  }, [active]);

  useEffect(() => () => clearTimeout(cueTimer.current), []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    live.setMuted(next);
  };

  const flashCue = (text) => {
    clearTimeout(cueTimer.current);
    dispatch({ type: 'cue', text });
    cueTimer.current = setTimeout(() => dispatch({ type: 'cue', text: null }), 2500);
  };

  const revealNext = () => {
    const next = script.tiles.find((tile) => !state.revealed.includes(tile.id));
    if (next) dispatch({ type: 'reveal', id: next.id });
  };

  const statusLabel = active ? 'Live' : connecting ? (script.context === 'in_person' ? 'Arriving' : 'Ringing') : state.phase === 'ended' ? 'Ended' : 'Ready';

  return (
    <DashboardLayout title="V3 Call Lab">
      <div className="mx-auto max-w-6xl space-y-5 py-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">V3 Call Lab</h1>
            <Badge variant="secondary">Test page</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            A sandbox for the version 3 call screen: a pixel-art dojo where the caller walks in or phones from home,
            plus the in-call widgets. Play a scripted demo for free, or drive it with a real call.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-wrap gap-x-6 gap-y-4 p-4">
            <Segmented
              label="Mode"
              value={mode}
              onChange={setMode}
              disabled={busy}
              options={[{ value: 'sim', label: 'Scripted demo' }, { value: 'live', label: 'Live call' }]}
            />
            <Segmented
              label="Scenario"
              value={scriptId}
              onChange={setScriptId}
              disabled={busy}
              options={DEMO_SCRIPTS.map((item) => ({ value: item.id, label: `${item.caller.name} - ${CONTEXT_LABELS[item.context]}` }))}
            />
            {isLive ? (
              <Segmented
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                disabled={busy}
                options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]}
              />
            ) : (
              <Segmented
                label="Playback speed"
                value={speed}
                onChange={setSpeed}
                disabled={busy}
                options={[{ value: 1, label: '1x' }, { value: 2, label: '2x' }, { value: 4, label: '4x' }]}
              />
            )}
            <Segmented
              label="Camera"
              value={zoom}
              onChange={setZoom}
              options={[{ value: 'auto', label: 'Auto' }, { value: 'wide', label: 'Wide' }, { value: 'close', label: 'Close' }]}
            />
            {isLive && (
              <p className="basis-full text-xs leading-5 text-muted-foreground">
                Live mode starts a real practice call with {callerName}: it uses your microphone, counts toward your
                school&apos;s minutes and appears in call history. The stage tracker, discovery board, warmth meter and
                objection card need the AI to report progress, so in live mode they only move from the test triggers.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div className="relative bg-[#3a8fca]">
                <DojoScene
                  context={script.context}
                  phase={SCENE_PHASE[state.phase]}
                  speaker={state.speaker}
                  volumeRef={session.volumeRef}
                  emote={state.emote}
                  zoom={zoom}
                  callerLook={script.caller.look}
                />
                <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-center gap-2">
                  <div className="flex w-full items-start justify-between gap-2">
                    {widgets.stage ? <StageTracker stages={script.stages} index={state.stage} started={active} /> : <span />}
                    <span className="shrink-0 rounded-lg bg-black/55 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
                      {formatClock(state.elapsedMs)}
                    </span>
                  </div>
                  {widgets.cues && <CueBanner text={cue} />}
                </div>
                {widgets.captions && (
                  <div className="pointer-events-none absolute inset-x-3 bottom-3">
                    <Captions lines={state.captions} callerName={callerName} />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ContextIcon className="h-4 w-4 text-primary" />
                    {callerName}
                    <Badge variant={active ? 'default' : 'outline'} className="font-normal">{statusLabel}</Badge>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{script.title} - {script.caller.blurb}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isLive && (
                    <Button variant="outline" size="sm" onClick={toggleMute} disabled={!active} aria-pressed={muted} className="gap-2">
                      {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {muted ? 'Unmute' : 'Mute'}
                    </Button>
                  )}
                  {!isLive && busy && (
                    <Button variant="outline" size="sm" onClick={sim.start} className="gap-2">
                      <RotateCcw className="h-4 w-4" />Restart
                    </Button>
                  )}
                  {busy ? (
                    <Button variant="destructive" size="sm" onClick={session.end} className="gap-2">
                      <PhoneOff className="h-4 w-4" />End call
                    </Button>
                  ) : (
                    <Button size="sm" onClick={session.start} className="gap-2">
                      {isLive ? <Phone className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isLive ? 'Start live call' : state.phase === 'ended' ? 'Play again' : 'Play demo call'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Test controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Show widgets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WIDGETS.map((widget) => (
                      <button
                        key={widget.id}
                        type="button"
                        aria-pressed={widgets[widget.id]}
                        onClick={() => setWidgets((prev) => ({ ...prev, [widget.id]: !prev[widget.id] }))}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          widgets[widget.id]
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {widget.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Trigger by hand</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'warmth', delta: 10 })}>Warmth +10</Button>
                    <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'warmth', delta: -10 })}>Warmth -10</Button>
                    <Button variant="outline" size="sm" onClick={revealNext}>Reveal next tile</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch({ type: 'stage', index: (state.stage + 1) % script.stages.length })}
                    >
                      Next stage
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'objection', label: 'Price concern' })}>Raise objection</Button>
                    <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'resolveObjection' })}>Resolve objection</Button>
                    <Button variant="outline" size="sm" onClick={() => flashCue('Hold the silence')}>Silence cue</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Caller emote</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOTE_IDS.map((id) => (
                      <Button key={id} variant="outline" size="sm" className="capitalize" onClick={() => dispatch({ type: 'emote', who: 'caller', id })}>
                        {id}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emotes show while the caller is on screen. The in-person caller only appears during a call.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {widgets.discovery && <DiscoveryBoard tiles={script.tiles} revealed={state.revealed} note={simOnlyNote} />}
            {widgets.warmth && <WarmthMeter value={state.warmth} callerName={callerName} note={simOnlyNote} />}
            {widgets.talk && <TalkBalance staffMs={state.talkMs.staff} callerMs={state.talkMs.caller} callerName={callerName} />}
            {widgets.objection && <ObjectionCard objection={state.objection} note={simOnlyNote} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

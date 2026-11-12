import { AlertTriangle, Check, CheckCircle2, Hand, Lock } from 'lucide-react';

// In-call widgets for the V3 lab. The overlay pieces sit on top of the scene,
// which is always dark, so they use fixed light-on-dark colours. The side
// panels use the normal theme tokens.

export function formatClock(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function StageTracker({ stages, index, started }) {
  return (
    <ol className="flex flex-wrap items-center gap-1 rounded-xl bg-black/55 p-1 text-[11px] font-medium text-white/70 backdrop-blur-sm">
      {stages.map((stage, i) => {
        const done = started && i < index;
        const current = started && i === index;
        return (
          <li
            key={stage}
            aria-current={current ? 'step' : undefined}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
              current ? 'bg-white text-slate-900' : done ? 'text-emerald-300' : ''
            }`}
          >
            {done ? <Check className="h-3 w-3" /> : <span className="tabular-nums opacity-70">{i + 1}</span>}
            {stage}
          </li>
        );
      })}
    </ol>
  );
}

export function CueBanner({ text }) {
  if (!text) return null;
  return (
    <div
      role="status"
      className="flex animate-pulse items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-lg"
    >
      <Hand className="h-4 w-4" />
      {text}
    </div>
  );
}

export function Captions({ lines, callerName }) {
  const visible = lines.slice(-2);
  if (visible.length === 0) return null;
  return (
    <div aria-live="polite" className="space-y-1 rounded-xl bg-black/65 px-3 py-2 text-sm leading-5 text-white backdrop-blur-sm">
      {visible.map((line, i) => (
        <p key={`${lines.length - visible.length + i}`} className={i < visible.length - 1 ? 'text-white/55' : ''}>
          <span className={`mr-1.5 font-semibold ${line.who === 'staff' ? 'text-sky-300' : 'text-amber-300'}`}>
            {line.who === 'staff' ? 'You' : callerName}
          </span>
          {line.text}
        </p>
      ))}
    </div>
  );
}

function Panel({ title, note, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export function DiscoveryBoard({ tiles, revealed, note }) {
  return (
    <Panel title="Discovery board" note={note ?? `${revealed.length} of ${tiles.length} uncovered`}>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => {
          const open = revealed.includes(tile.id);
          return open ? (
            <div
              key={tile.id}
              className="animate-in fade-in zoom-in-95 rounded-lg border border-primary/30 bg-primary/5 p-2.5 duration-300"
            >
              <p className="text-[11px] font-medium text-primary">{tile.label}</p>
              <p className="mt-0.5 text-xs leading-4 text-foreground">{tile.value}</p>
            </div>
          ) : (
            <div key={tile.id} className="rounded-lg border border-dashed border-border bg-secondary/30 p-2.5">
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                {tile.label}
              </p>
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground/60">Ask to uncover</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function warmthLabel(value) {
  if (value >= 80) return 'Won over';
  if (value >= 60) return 'Warm';
  if (value >= 40) return 'Neutral';
  if (value >= 20) return 'Guarded';
  return 'Cold';
}

export function WarmthMeter({ value, callerName, note }) {
  return (
    <Panel title={`How ${callerName} feels`} note={note ?? warmthLabel(value)}>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label="Caller warmth"
        className="relative h-2.5 rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500"
      >
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow transition-all duration-500"
          style={{ left: `${value}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>Cold</span>
        <span>Won over</span>
      </div>
    </Panel>
  );
}

export function TalkBalance({ staffMs, callerMs, callerName }) {
  const total = staffMs + callerMs;
  const staffPct = total > 0 ? Math.round((staffMs / total) * 100) : 50;
  const overTalking = total > 4000 && staffPct > 60;
  return (
    <Panel title="Talk time" note={overTalking ? 'You are doing most of the talking' : 'Aim to listen at least half'}>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={`transition-all duration-300 ${overTalking ? 'bg-amber-500' : 'bg-sky-500'}`}
          style={{ width: `${staffPct}%` }}
        />
        <div className="flex-1 bg-emerald-500/70" />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="font-medium">You {total > 0 ? `${staffPct}%` : '-'}</span>
        <span className="text-muted-foreground">{callerName} {total > 0 ? `${100 - staffPct}%` : '-'}</span>
      </div>
    </Panel>
  );
}

export function ObjectionCard({ objection, note }) {
  return (
    <Panel title="Objection" note={note}>
      {!objection ? (
        <p className="text-xs text-muted-foreground">Nothing raised yet.</p>
      ) : objection.resolved ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {objection.label} - handled
        </p>
      ) : (
        <p className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {objection.label} - still open
        </p>
      )}
    </Panel>
  );
}

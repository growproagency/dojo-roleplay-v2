import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSaveTutorialProgress, useTutorialProgress } from '../../hooks/useTutorial';
import { Button } from '../../components/ui/button';
import {
  NEW_USER_TOUR_KEY,
  NEW_USER_TOUR_VERSION,
  newUserTourSteps,
} from './tutorial.config';

const REPLAY_EVENT = 'dojo:replay-tutorial';
const TARGET_GAP = 8;

export function replayTutorial() {
  window.dispatchEvent(new Event(REPLAY_EVENT));
}

export function TutorialProvider() {
  const { user, profile, isGlobalAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const eligible = Boolean(user && profile?.schoolId && !isGlobalAdmin);
  const { data: progress, isSuccess } = useTutorialProgress(
    NEW_USER_TOUR_KEY,
    NEW_USER_TOUR_VERSION,
    { enabled: eligible },
  );
  const { mutate: saveProgress } = useSaveTutorialProgress(NEW_USER_TOUR_KEY, NEW_USER_TOUR_VERSION);
  const step = newUserTourSteps[stepIndex];

  const persist = useCallback((status, currentStep) => {
    saveProgress({ status, currentStep });
  }, [saveProgress]);

  useEffect(() => {
    if (!eligible || !isSuccess || location.pathname !== '/dashboard') return;
    if (!progress) {
      setStepIndex(0);
      setActive(true);
      persist('in_progress', 0);
    } else if (progress.status === 'in_progress') {
      setStepIndex(Math.min(progress.currentStep, newUserTourSteps.length - 1));
      setActive(true);
    }
  }, [eligible, isSuccess, location.pathname, progress, persist]);

  useEffect(() => {
    const replay = () => {
      setStepIndex(0);
      setActive(true);
      persist('in_progress', 0);
      navigate('/dashboard');
    };
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, [navigate, persist]);

  useEffect(() => {
    if (active && step?.route && location.pathname !== step.route) navigate(step.route);
  }, [active, location.pathname, navigate, step]);

  useLayoutEffect(() => {
    if (!active || !step?.target || location.pathname !== step.route) {
      setTargetRect(null);
      return undefined;
    }
    let frame;
    let attempts = 0;
    const locate = () => {
      const element = document.querySelector(step.target);
      if (!element && attempts++ < 20) {
        frame = window.requestAnimationFrame(locate);
        return;
      }
      if (!element) {
        setTargetRect(null);
        return;
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const update = () => {
        const rect = element.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      };
      window.setTimeout(update, 250);
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      frame = () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    };
    locate();
    return () => {
      if (typeof frame === 'number') window.cancelAnimationFrame(frame);
      else if (typeof frame === 'function') frame();
    };
  }, [active, location.pathname, step]);

  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActive(false);
        persist('skipped', stepIndex);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, persist, stepIndex]);

  if (!active || !step) return null;

  const goTo = (nextIndex) => {
    setStepIndex(nextIndex);
    persist('in_progress', nextIndex);
  };
  const close = (status) => {
    setActive(false);
    persist(status, stepIndex);
  };

  return createPortal(
    <TutorialOverlay
      step={step}
      stepIndex={stepIndex}
      targetRect={targetRect}
      onBack={() => goTo(stepIndex - 1)}
      onNext={() => goTo(stepIndex + 1)}
      onSkip={() => close('skipped')}
      onFinish={() => close('completed')}
    />,
    document.body,
  );
}

function TutorialOverlay({ step, stepIndex, targetRect, onBack, onNext, onSkip, onFinish }) {
  const isLast = stepIndex === newUserTourSteps.length - 1;
  const cardStyle = getCardStyle(targetRect);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
      {targetRect && (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-white shadow-[0_0_0_4px_rgba(59,130,246,0.7)]"
          style={{
            top: targetRect.top - TARGET_GAP,
            left: targetRect.left - TARGET_GAP,
            width: targetRect.width + TARGET_GAP * 2,
            height: targetRect.height + TARGET_GAP * 2,
          }}
        />
      )}
      <section
        className="fixed w-[min(92vw,390px)] rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl"
        style={cardStyle}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step {stepIndex + 1} of {newUserTourSteps.length}
          </span>
          <button type="button" onClick={onSkip} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Skip tutorial">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="tutorial-title" className="text-lg font-semibold">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.content}</p>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((stepIndex + 1) / newUserTourSteps.length) * 100}%` }} />
        </div>
        {isLast ? (
          <div className="mt-5 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onBack} className="px-2.5">
              <ChevronLeft />Back
            </Button>
            <Button type="button" onClick={onFinish}>
              Start practicing
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onSkip}>Skip tour</Button>
            <div className="flex gap-2">
              {stepIndex > 0 && <Button type="button" variant="outline" onClick={onBack}><ChevronLeft />Back</Button>}
              <Button type="button" onClick={onNext}>Next<ChevronRight /></Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function getCardStyle(rect) {
  if (!rect || window.innerWidth < 640) {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }
  const width = 390;
  const gap = 20;
  const left = Math.min(Math.max(gap, rect.left), window.innerWidth - width - gap);
  const below = rect.top + rect.height + gap;
  const top = below + 300 < window.innerHeight ? below : Math.max(gap, rect.top - 300 - gap);
  return { left, top };
}

import { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useVapiConfig, useVapiScenarioAssistant, useVapiSessionToken } from '../hooks/useVapi';
import { Button } from './ui/button';
import { Phone, X, Loader2, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import Vapi from '@vapi-ai/web';

const emitCallState = (status) => {
  window.dispatchEvent(new CustomEvent('dojo:call-state', { detail: { status } }));
};

const emitCallScenario = (scenario) => {
  window.dispatchEvent(new CustomEvent('dojo:call-scenario', { detail: { scenario } }));
};

const getVapiErrorMessage = (err) => (
  err?.error?.message
  || err?.error?.error
  || err?.message
  || err?.reason
  || 'Something went wrong'
);

const SCENARIO_ALIASES = {
  new_student: 'new_student',
  parent_enrollment: 'parent_enrollment',
  web_lead_callback: 'web_lead_callback',
  sales_enrollment: 'sales_enrollment',
  renewal_conference: 'renewal_conference',
  cancellation_save: 'cancellation_save',
};

const normalizeScenario = (value) => {
  if (!value) return null;
  const text = String(value).trim().toLowerCase().replace(/[_-]+/g, ' ');
  return SCENARIO_ALIASES[text] ?? SCENARIO_ALIASES[text.replace(/\s+/g, '_')] ?? text.replace(/\s+/g, '_');
};

const findScenarioValue = (value, depth = 0) => {
  if (!value || depth > 5) return null;
  if (typeof value === 'string') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findScenarioValue(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  for (const [key, child] of Object.entries(value)) {
    if (key.toLowerCase() === 'scenario' && typeof child === 'string') {
      return normalizeScenario(child);
    }
    const found = findScenarioValue(child, depth + 1);
    if (found) return found;
  }
  return null;
};

export function CallWidget() {
  const navigate = useNavigate();
  const { user, isGlobalAdmin, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [webCallActive, setWebCallActive] = useState(false);
  const [webCallConnecting, setWebCallConnecting] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const vapiRef = useRef(null);
  const timerRef = useRef(null);
  const getSessionToken = useVapiSessionToken();
  const getScenarioAssistant = useVapiScenarioAssistant();

  const { data: vapiConfig } = useVapiConfig(!!user);

  const schoolAccessAllowed = profile?.school?.accessStatus?.allowed !== false;
  const shouldShow = user && schoolAccessAllowed && (profile?.schoolId || isGlobalAdmin) && vapiConfig?.configured;

  useEffect(() => {
    if (webCallActive) {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [webCallActive]);

  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try { vapiRef.current.stop(); } catch {}
        vapiRef.current = null;
      }
    };
  }, []);

  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const openPracticePage = useCallback(() => {
    setOpen(false);
    navigate('/practice');
  }, [navigate]);

  const startWebCall = useCallback(async (callOptions = {}) => {
    if (!vapiConfig?.publicKey || !vapiConfig?.assistantId) {
      toast.error('Vapi not configured on the server.');
      return;
    }
    try {
      setWebCallConnecting(true);
      emitCallState('connecting');
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        toast.error('Could not identify your session. Please refresh and try again.');
        setWebCallConnecting(false);
        emitCallState('idle');
        return;
      }

      const vapi = new Vapi(vapiConfig.publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setWebCallConnecting(false);
        setWebCallActive(true);
        emitCallState('active');
        toast.success('Connected! Speak to the AI receptionist.');
      });
      vapi.on('call-end', () => {
        setWebCallActive(false);
        setWebCallConnecting(false);
        vapiRef.current = null;
        emitCallState('idle');
        toast.info('Call ended. Your scorecard will be ready shortly.');
      });
      vapi.on('error', (err) => {
        if (import.meta.env.DEV) {
          console.error('[Vapi error]', err);
        }
        setWebCallActive(false);
        setWebCallConnecting(false);
        vapiRef.current = null;
        emitCallState('idle');
        toast.error('Call error: ' + getVapiErrorMessage(err));
      });
      vapi.on('call-start-failed', (err) => {
        if (import.meta.env.DEV) {
          console.error('[Vapi call start failed]', err);
        }
      });
      vapi.on('message', (message) => {
        const scenario = findScenarioValue(message);
        if (scenario) emitCallScenario(scenario);
        if (import.meta.env.DEV) {
          console.debug('[Vapi message]', message);
        }
      });

      const selectedScenario = callOptions.scenario ?? null;
      const selectedScenarioTitle = callOptions.scenarioTitle ?? null;
      const selectedDifficulty = callOptions.difficulty ?? null;
      const selectedAssistant = selectedScenario && selectedDifficulty
        ? await getScenarioAssistant({ scenario: selectedScenario, difficulty: selectedDifficulty })
        : null;
      const overrides = {
        metadata: {
          sessionToken,
          selectedScenario,
          selectedScenarioTitle,
          selectedDifficulty,
        },
        ...(!selectedAssistant && selectedScenarioTitle
          ? { firstMessage: `You selected ${selectedScenarioTitle}. What difficulty would you like: easy, medium, or hard?` }
          : {}),
        variableValues: {
          selectedScenario,
          selectedScenarioTitle,
          selectedDifficulty,
        },
      };
      await vapi.start(selectedAssistant || vapiConfig.assistantId, overrides);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Vapi start failed]', err);
      }
      setWebCallConnecting(false);
      emitCallState('idle');
      toast.error('Failed to start web call: ' + getVapiErrorMessage(err));
    }
  }, [getScenarioAssistant, getSessionToken, vapiConfig]);

  const endWebCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    setWebCallActive(false);
    setWebCallConnecting(false);
    emitCallState('idle');
  }, []);

  useEffect(() => {
    const handleStartRequest = (event) => {
      if (!webCallActive && !webCallConnecting) startWebCall(event.detail ?? {});
    };
    const handleEndRequest = () => endWebCall();

    window.addEventListener('dojo:start-call', handleStartRequest);
    window.addEventListener('dojo:end-call', handleEndRequest);
    return () => {
      window.removeEventListener('dojo:start-call', handleStartRequest);
      window.removeEventListener('dojo:end-call', handleEndRequest);
    };
  }, [endWebCall, startWebCall, webCallActive, webCallConnecting]);

  if (!shouldShow) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
      >
        {webCallActive ? (
          <span className="text-xs font-mono font-bold">{formatTimer(callSeconds)}</span>
        ) : (
          <Phone className="w-6 h-6" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Web Call</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {webCallActive ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 mx-auto flex items-center justify-center animate-pulse">
              <Phone className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm font-medium">Call in progress</p>
            <p className="text-2xl font-mono font-bold tabular-nums">{formatTimer(callSeconds)}</p>
            <Button variant="destructive" className="w-full gap-2" onClick={endWebCall}>
              <X className="w-4 h-4" />End Call
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Choose a scenario on the Practice Call page, then start a web-based training call.
            </p>
            <Button className="w-full gap-2" onClick={openPracticePage}>
              <Phone className="w-4 h-4" />
              Open Practice Call
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

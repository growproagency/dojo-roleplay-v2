import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useScenarios } from '../hooks/useScenarios';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AudioWaveform } from '../components/AudioWaveform';
import { BookOpen, CheckCircle2, ChevronUp, Copy, FileText, Headphones, Loader2, Phone, Sparkles, Users } from 'lucide-react';

const CONTEXT_LABELS = {
  inbound_call: 'Inbound call',
  outbound_callback: 'Outbound callback',
  in_person: 'In person',
};

const BUILT_IN_DETAILS = {
  new_student: {
    contextType: 'inbound_call',
    characterName: 'Jordan',
    characterBlurb: 'adult prospect who found you online',
    topics: ['Cost', 'Schedule', 'Commitment concerns'],
  },
  parent_enrollment: {
    contextType: 'inbound_call',
    characterName: 'Sarah',
    characterBlurb: 'parent of a 7-year-old',
    topics: ['Safety', 'Focus & discipline', 'Class schedule'],
  },
  web_lead_callback: {
    contextType: 'outbound_callback',
    characterName: 'Alex',
    characterBlurb: "submitted a web form, hasn't responded",
    topics: ['Building rapport', 'Overcoming skepticism', 'Booking the appointment'],
  },
  sales_enrollment: {
    contextType: 'in_person',
    characterName: 'Jamie',
    characterBlurb: 'just finished a trial class',
    topics: ['Uncovering goals', 'Presenting benefits', 'Pricing options'],
  },
  renewal_conference: {
    contextType: 'in_person',
    characterName: 'Pat',
    characterBlurb: 'parent of Tyler, 10 months in',
    topics: ['Progress check questions', 'Highlighting growth', 'Renewal offer'],
  },
  cancellation_save: {
    contextType: 'inbound_call',
    characterName: 'Morgan',
    characterBlurb: "parent calling to cancel Cameron's membership",
    topics: ['Finding the real reason', 'Extended Time Guarantee', 'Closing the save'],
  },
};

const SCENARIO_IMAGES = {
  new_student: '/scenario-new-student.png',
  parent_enrollment: '/scenario-parent-enrollment.png',
  web_lead_callback: '/scenario-web-lead-callback.png',
  sales_enrollment: '/scenario-sales-enrollment.png',
  renewal_conference: '/scenario-renewal-conference.png',
  cancellation_save: '/scenario-cancellation-save.png',
};

const PRACTICE_SCENARIO_LABELS = {
  new_student: 'Inbound Lead - Adult Inquiry',
  parent_enrollment: 'Inbound Lead - Parent Inquiry',
  web_lead_callback: 'Outbound Lead Callback',
};

const SCENARIO_ALIASES = {
  'new adult student inquiry': 'new_student',
  'adult student inquiry': 'new_student',
  'current enrollment': 'new_student',
  'inbound lead adult inquiry': 'new_student',
  'new student': 'new_student',
  'parent enrolling a child': 'parent_enrollment',
  'parent enrollment': 'parent_enrollment',
  'inbound lead parent inquiry': 'parent_enrollment',
  'outbound web lead callback': 'web_lead_callback',
  'web lead callback': 'web_lead_callback',
  'outbound lead callback': 'web_lead_callback',
  'sales enrollment conference': 'sales_enrollment',
  'sales enrollment': 'sales_enrollment',
  'renewal conference': 'renewal_conference',
  'cancellation save': 'cancellation_save',
};

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'bg-green-500', description: 'Friendly, few objections. Good for warm-up.' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500', description: 'Realistic. Some hesitation and pushback.' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500', description: 'Skeptical and busy. Lots of objections.' },
];

const TRAINING_GUIDES = {
  inbound: {
    title: 'Inbound Inquiry',
    description: 'Based on the 13-step inbound call script.',
    steps: [
      ['Greeting', 'Warm energy, got full name, school intro'],
      ['Identify caller', "For self or child? Child's age?"],
      ['Confirm location', 'Make sure they are contacting the right school or service area'],
      ['Determine lead source', 'Ask how they heard about the school'],
      ['Identify desired benefits / WHY', 'Probe deeper if the answer is vague'],
      ['Current efforts', 'Ask whether they have tried any previous training'],
      ['Position the school', 'Connect the school to their specific WHY'],
      ['Present the offer', 'Explain the free trial or intro offer'],
      ['Schedule the appointment', 'Offer specific time slots'],
      ['Gather information', 'Collect name, email, and phone'],
      ['Ask for referrals', 'Ask whether anyone else may want to try the class'],
      ['Pre-frame the sign-up', '"If you like what you see, we can get you signed up - fair enough?"'],
      ['Provide next steps', 'Explain what to wear, what to bring, and logistics'],
    ],
    categories: [
      ['Rapport & Greeting', '10%'],
      ['Needs Discovery', '20%'],
      ['School Positioning & Offer', '20%'],
      ['Objection Handling', '20%'],
      ['Appointment Setting', '20%'],
      ['Information Gathering & Referrals', '10%'],
    ],
  },
  outbound: {
    title: 'Outbound Callback',
    description: 'Based on the 12-step outbound callback script.',
    steps: [
      ['Warm introduction', 'Open with friendly energy and identify yourself and the school'],
      ['Reference the form', 'Remind them they requested information or showed interest online'],
      ['Establish rapport', 'Keep it conversational before moving into questions'],
      ['Identify WHY', 'Ask what they are hoping to get from training'],
      ['Handle cold open / skepticism', 'Acknowledge hesitation and keep the call low-pressure'],
      ['Position the school', 'Connect the school to their stated goal or concern'],
      ['Present the offer', 'Explain the free trial, intro class, or next best offer'],
      ['Handle think about it', 'Clarify what they need to think about and keep momentum'],
      ['Schedule appointment', 'Offer specific appointment or class times'],
      ['Gather information', 'Confirm name, email, phone, and any key student details'],
      ['Pre-frame the visit', 'Explain what will happen when they arrive'],
      ['Confirm next steps', 'Recap date, time, location, and expectations'],
    ],
    categories: [
      ['Rapport & Introduction', '20%'],
      ['Needs Discovery', '20%'],
      ['School Positioning & Offer', '15%'],
      ['Objection Handling', '20%'],
      ['Appointment Setting', '15%'],
      ['Information & Next Steps', '10%'],
    ],
  },
  sales: {
    title: 'Sales Enrollment',
    description: 'Based on the 4-step enrollment process.',
    steps: [
      ['Talk about the student / Go Fishing', 'Ask about goals, progress, and what the student enjoyed'],
      ['Teach the benefit / Over Time', 'Explain how training creates the desired result over time'],
      ['Pre-frame the upgrade / Compare & Contrast', 'Show why the full program is the stronger path than staying short-term'],
      ['Present pricing conversationally', 'Explain options clearly and ask for the enrollment decision'],
    ],
    categories: [
      ['Needs Discovery / Go Fishing', '25%'],
      ['Benefit Teaching / Over Time', '20%'],
      ['Upgrade Pre-Frame', '15%'],
      ['Pricing Presentation', '15%'],
      ['Objection Handling', '15%'],
      ['Closing Technique', '10%'],
    ],
  },
  renewal: {
    title: 'Renewal',
    description: 'Based on the 4-step renewal process.',
    steps: [
      ['Book the progress check', 'Set a dedicated conversation instead of surprising the parent or student'],
      ['Ask the 3 questions', 'Review what has improved, what they still want, and what comes next'],
      ['Highlight specific progress', 'Use concrete examples of growth, confidence, focus, or skill'],
      ['Present the renewal', 'Connect the next membership period to their continued goals'],
    ],
    categories: [
      ['Progress Check Framing', '15%'],
      ['The 3 Questions', '30%'],
      ['Specific Progress Highlight', '20%'],
      ['Renewal Ask', '20%'],
      ['Objection Handling', '10%'],
      ['Follow-Up Discipline', '5%'],
    ],
  },
  cancellation: {
    title: 'Cancellation Save',
    description: 'Based on the cancellation save process.',
    steps: [
      ['Universal opening', 'Stay calm, thank them for sharing, and avoid sounding defensive'],
      ['Identify the real reason', 'Ask questions to uncover whether it is schedule, money, motivation, or value'],
      ['Deploy the right save tool', 'Match the save response to the real objection'],
      ['Extended Time Guarantee', 'Use the guarantee when more time could reasonably solve the concern'],
      ['Close or graceful exit', 'Confirm the save, next step, or cancellation path professionally'],
    ],
    categories: [
      ['Universal Opening', '20%'],
      ['Reason Discovery', '25%'],
      ['Save Strategy', '25%'],
      ['ETG Deployment', '15%'],
      ['Close or Exit Quality', '15%'],
    ],
  },
};

const SELECTED_SCENARIO_STORAGE_KEY = 'dojo:selected-practice-scenario';
const SELECTED_DIFFICULTY_STORAGE_KEY = 'dojo:selected-practice-difficulty';
const CALL_IN_PHONE_NUMBER = '+17275134280';

function normalizeScenarioId(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase().replace(/[-\s]+/g, '_');
  const readable = String(value).trim().toLowerCase().replace(/[_-]+/g, ' ');
  return SCENARIO_ALIASES[readable] ?? normalized;
}

function getScenarioKey(scenario) {
  if (!scenario) return null;
  if (scenario.isBuiltIn) return normalizeScenarioId(scenario.id ?? scenario.slug) ?? normalizeScenarioId(scenario.title);
  return normalizeScenarioId(scenario.slug) ?? normalizeScenarioId(scenario.id) ?? normalizeScenarioId(scenario.title);
}

function getPracticeScenarioTitle(scenario) {
  const key = getScenarioKey(scenario);
  return PRACTICE_SCENARIO_LABELS[key] ?? scenario?.title ?? 'Training scenario';
}

function scenarioMeta(scenario) {
  const builtIn = BUILT_IN_DETAILS[scenario.id] ?? {};
  return {
    contextType: scenario.contextType ?? builtIn.contextType ?? 'inbound_call',
    characterName: scenario.characterName ?? builtIn.characterName,
    characterBlurb: scenario.characterBlurb ?? builtIn.characterBlurb,
    description: scenario.description ?? builtIn.characterBlurb ?? '',
    topics: Array.isArray(scenario.topics) ? scenario.topics : builtIn.topics ?? [],
    script: scenario.characterPrompt ?? scenario.systemPrompt ?? '',
  };
}

function getTrainingGuide(scenario) {
  const key = getScenarioKey(scenario);
  const title = (scenario?.title || '').toLowerCase();
  if (key === 'cancellation_save' || title.includes('cancellation')) return TRAINING_GUIDES.cancellation;
  if (key === 'renewal_conference' || title.includes('renewal')) return TRAINING_GUIDES.renewal;
  if (key === 'sales_enrollment' || title.includes('sales enrollment') || title.includes('enrollment conference')) return TRAINING_GUIDES.sales;
  if (key === 'new_student' || key === 'parent_enrollment') return TRAINING_GUIDES.inbound;
  if (key === 'web_lead_callback' || title.includes('outbound') || title.includes('callback')) return TRAINING_GUIDES.outbound;
  return TRAINING_GUIDES.inbound;
}

function getCustomRubricCategories(scoringPrompt) {
  if (!scoringPrompt) return [];
  return String(scoringPrompt)
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^\d+\.\s+(.+?)(?:\s*[-:]\s*.*)?$/);
      return match?.[1]?.trim();
    })
    .filter(Boolean)
    .slice(0, 8)
    .map((name) => [name, 'Avg']);
}

function ScenarioCard({ scenario, isLocked, isSelected, onSelect, onViewScript }) {
  const meta = scenarioMeta(scenario);
  const ContextIcon = meta.contextType === 'in_person' ? Users : Phone;
  const title = getPracticeScenarioTitle(scenario);
  const isCustom = !scenario.isBuiltIn;
  const summaryText = isCustom
    ? meta.description
    : [meta.characterName, meta.characterBlurb].filter(Boolean).join(' - ');

  return (
    <div
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      onClick={() => {
        if (!isLocked) onSelect(scenario);
      }}
      onKeyDown={(event) => {
        if (isLocked) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(scenario);
        }
      }}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        isSelected
          ? 'border-primary/45 bg-primary/5 ring-1 ring-primary/15'
          : isLocked
            ? 'border-border/80 bg-secondary/10 opacity-70'
            : 'border-border/80 bg-secondary/20 hover:bg-secondary/35'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <h3 className="min-w-0 font-heading text-sm font-medium leading-5">{title}</h3>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium leading-4 text-muted-foreground">
                <ContextIcon className="h-2.5 w-2.5 text-primary" />
                {CONTEXT_LABELS[meta.contextType] ?? 'Training call'}
              </span>
              {!scenario.isBuiltIn && <Badge variant="secondary">Custom</Badge>}
            </div>
            {summaryText && (
              <p
                className="overflow-hidden pr-10 text-xs leading-5 text-muted-foreground"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {summaryText}
              </p>
            )}
          </div>

          {meta.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
            {meta.topics.slice(0, 2).map((topic) => (
              <Badge key={topic} variant="outline" className="font-normal text-muted-foreground">
                {topic}
              </Badge>
            ))}
            </div>
          )}
        </div>

        {scenario.isBuiltIn && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewScript(scenario);
            }}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10"
            aria-label={`View ${title} training script`}
          >
            <FileText className="h-3.5 w-3.5" />
            Script
          </button>
        )}
      </div>
    </div>
  );
}

export function PracticeCallPage() {
  const { data: scenarios, isLoading } = useScenarios();
  const [scriptScenario, setScriptScenario] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(() => (
    window.localStorage.getItem(SELECTED_SCENARIO_STORAGE_KEY)
  ));
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => (
    window.localStorage.getItem(SELECTED_DIFFICULTY_STORAGE_KEY) || 'medium'
  ));
  const selectedScenario = (scenarios ?? []).find((scenario) => {
    const ids = [getScenarioKey(scenario), normalizeScenarioId(scenario.id), normalizeScenarioId(scenario.slug), normalizeScenarioId(scenario.title)];
    return ids.includes(selectedScenarioId);
  });
  const selectedScenarioTitle = getPracticeScenarioTitle(selectedScenario);
  const startPractice = () => {
    if (!selectedScenario) return;
    const scenarioKey = getScenarioKey(selectedScenario);
    window.dispatchEvent(new CustomEvent('dojo:start-call', {
      detail: {
        scenario: scenarioKey,
        scenarioTitle: selectedScenarioTitle,
        difficulty: selectedDifficulty,
      },
    }));
  };
  const endPractice = () => window.dispatchEvent(new Event('dojo:end-call'));
  const scriptGuide = scriptScenario ? getTrainingGuide(scriptScenario) : null;
  const callActive = callStatus === 'active' || callStatus === 'connecting';
  const callConnecting = callStatus === 'connecting';
  const callStatusLabel = callStatus === 'active' ? 'Live' : callStatus === 'connecting' ? 'Connecting' : 'Standby';
  const callStatusDescription = callStatus === 'active'
    ? 'Call in progress'
    : callStatus === 'connecting'
      ? 'Connecting to the receptionist'
      : 'Ready to start selected scenario';
  const callButtonLabel = callStatus === 'active'
    ? 'End Call'
    : callConnecting
      ? 'Connecting...'
      : selectedScenario
        ? `Start ${selectedScenarioTitle} (${selectedDifficulty})`
        : 'Choose a scenario';
  const selectedScenarioKey = getScenarioKey(selectedScenario) ?? selectedScenarioId ?? normalizeScenarioId(selectedScenario?.id);
  const selectedImage = SCENARIO_IMAGES[selectedScenarioKey] ?? '/ai-caller-room.png';
  const selectedMeta = selectedScenario ? scenarioMeta(selectedScenario) : null;
  const selectedSummary = selectedScenario?.isBuiltIn
    ? [selectedMeta?.characterName, selectedMeta?.characterBlurb].filter(Boolean).join(' - ')
    : selectedMeta?.description;
  const selectedRubric = selectedScenario
    ? selectedScenario.isBuiltIn
      ? getTrainingGuide(selectedScenario).categories
      : getCustomRubricCategories(selectedScenario.scoringPrompt)
    : [];
  const handleCallButton = () => {
    if (callStatus === 'active') endPractice();
    else if (!callConnecting) startPractice();
  };
  const copyPhoneNumber = async () => {
    await navigator.clipboard.writeText(CALL_IN_PHONE_NUMBER);
    setPhoneCopied(true);
    window.setTimeout(() => setPhoneCopied(false), 1600);
  };

  useEffect(() => {
    const handleCallState = (event) => setCallStatus(event.detail?.status ?? 'idle');
    window.addEventListener('dojo:call-state', handleCallState);
    return () => window.removeEventListener('dojo:call-state', handleCallState);
  }, []);

  useEffect(() => {
    const handleCallScenario = (event) => {
      const scenarioId = normalizeScenarioId(event.detail?.scenario);
      if (scenarioId) setSelectedScenarioId(scenarioId);
    };
    window.addEventListener('dojo:call-scenario', handleCallScenario);
    return () => window.removeEventListener('dojo:call-scenario', handleCallScenario);
  }, []);

  useEffect(() => {
    if (selectedScenarioId) {
      window.localStorage.setItem(SELECTED_SCENARIO_STORAGE_KEY, selectedScenarioId);
    }
  }, [selectedScenarioId]);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_DIFFICULTY_STORAGE_KEY, selectedDifficulty);
  }, [selectedDifficulty]);

  useEffect(() => {
    const selectedKey = getScenarioKey(selectedScenario);
    if (selectedKey && selectedScenarioId !== selectedKey) {
      setSelectedScenarioId(selectedKey);
    }
  }, [selectedScenario, selectedScenarioId]);

  useEffect(() => {
    if (selectedScenarioId || !scenarios?.length) return;
    setSelectedScenarioId(getScenarioKey(scenarios[0]));
  }, [scenarios, selectedScenarioId]);

  return (
    <DashboardLayout title="Practice Call">
      <div className="mx-auto max-w-6xl space-y-6 py-2">
        <Card className="relative overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-sm dark:border-primary/30">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/20" />
            <img
              src="/ai_dojo_gate.svg"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-8 -right-6 h-64 w-64"
            />
          </div>
          <CardContent className="relative flex min-h-[170px] flex-col justify-center p-7 sm:p-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
                <Sparkles className="h-3.5 w-3.5" />
                AI practice room
              </div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                Practice your next enrollment conversation
              </h1>
              <p className="mt-2 text-sm text-white/75 sm:text-base">
                Choose a scenario and difficulty, start the AI caller, and get a scored call review when you finish.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(360px,0.4fr)]">
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Headphones className="h-4 w-4 text-primary" />
                  </span>
                  AI Caller
                </span>
                <Badge variant={callStatus === 'active' ? 'default' : 'outline'} className="font-normal">
                  {callStatus === 'idle' ? 'Ready' : callStatusLabel}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-border/70 bg-secondary/30">
                <img
                  src={selectedImage}
                  alt={selectedScenario ? `${selectedScenarioTitle} practice caller` : 'AI caller ready for a practice roleplay session'}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/35 bg-background/88 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-background/78">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedScenario ? selectedScenarioTitle : 'AI Receptionist'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSummary
                          ? selectedSummary
                          : callStatusDescription}
                      </p>
                    </div>
                    <Badge variant={callStatus === 'active' ? 'default' : 'outline'} className="font-normal">
                      {callStatusLabel}
                    </Badge>
                  </div>
                  <div className="py-3">
                    <AudioWaveform active={callActive} reactive={callActive} speed={callStatus === 'active' ? 'fast' : 'normal'} />
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleCallButton}
                  disabled={callConnecting || (!selectedScenario && callStatus !== 'active')}
                  variant={callStatus === 'active' ? 'destructive' : 'default'}
                  className="h-10 w-full max-w-sm gap-2 rounded-full"
                >
                  {callConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                  <span className="truncate">{callButtonLabel}</span>
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Call from your phone</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                  <a href={`tel:${CALL_IN_PHONE_NUMBER}`} className="font-medium tracking-wide text-foreground">
                    {CALL_IN_PHONE_NUMBER}
                  </a>
                  <button
                    type="button"
                    onClick={copyPhoneNumber}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    aria-label="Copy phone number"
                  >
                    {phoneCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Phone calls use the phone number saved in your profile to match you to your school.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Voice roleplay session</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {selectedScenario
                    ? `Selected scenario: ${selectedScenarioTitle}. Difficulty: ${selectedDifficulty}. The call will hand off directly to the practice caller.`
                    : 'Choose a scenario on the right before starting your web call. Phone callers can still choose by voice.'}
                </p>
                {selectedRubric.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium">Scoring rubric</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {selectedRubric.map(([name, weight]) => (
                        <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                          <span className="min-w-0 truncate text-xs text-muted-foreground">{name}</span>
                          <Badge variant="outline" className="shrink-0 font-normal">{weight}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Available scenarios
                {scenarios && <span className="text-xs font-normal text-muted-foreground">({scenarios.length})</span>}
              </span>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Choose a scenario before starting your web call. The selected difficulty below will be sent with the call.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !scenarios || scenarios.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No scenarios available.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id ?? scenario.slug}
                    scenario={scenario}
                    isLocked={callActive}
                    isSelected={getScenarioKey(scenario) === selectedScenarioId}
                    onSelect={(nextScenario) => setSelectedScenarioId(getScenarioKey(nextScenario))}
                    onViewScript={setScriptScenario}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty.value}
                  type="button"
                  disabled={callActive}
                  onClick={() => setSelectedDifficulty(difficulty.value)}
                  className={`flex gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                    selectedDifficulty === difficulty.value
                      ? 'border-primary/45 bg-primary/5 ring-1 ring-primary/15'
                      : 'border-border/70 bg-secondary/20 hover:bg-secondary/35'
                  } ${callActive ? 'cursor-not-allowed opacity-70' : ''}`}
                  aria-pressed={selectedDifficulty === difficulty.value}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${difficulty.color}`} />
                  <div>
                    <p className="font-medium">{difficulty.label}</p>
                    <p className="text-xs leading-5 text-muted-foreground">{difficulty.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!scriptScenario} onOpenChange={(open) => { if (!open) setScriptScenario(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{scriptScenario ? getPracticeScenarioTitle(scriptScenario) : 'Training script'}</DialogTitle>
          </DialogHeader>
          {scriptGuide && (
            <div className="space-y-5 text-sm">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-heading text-base font-semibold text-foreground">{scriptGuide.title}</p>
                <p className="mt-1 text-muted-foreground">{scriptGuide.description}</p>
              </div>

              <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-medium text-foreground">Call script</p>
                  <ol className="mt-3 space-y-2">
                    {scriptGuide.steps.map((step, index) => {
                      const [label, description] = Array.isArray(step) ? step : [step, null];
                      return (
                      <li key={label} className="flex gap-3 text-muted-foreground">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="pt-0.5">
                          <span className="font-medium text-foreground">{label}</span>
                          {description && <span className="block text-xs leading-5 text-muted-foreground">{description}</span>}
                        </span>
                      </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-medium text-foreground">Scoring categories</p>
                  <div className="mt-3 space-y-2">
                    {scriptGuide.categories.map(([name, weight]) => (
                      <div key={name} className="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2">
                        <span className="text-muted-foreground">{name}</span>
                        <Badge variant="outline" className="shrink-0 font-normal">{weight}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {scriptScenario?.scoringPrompt && (
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-medium text-foreground">Custom scoring rubric</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
                    {scriptScenario.scoringPrompt}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

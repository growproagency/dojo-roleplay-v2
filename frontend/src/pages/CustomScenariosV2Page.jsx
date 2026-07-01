import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  CircuitBoard,
  ListChecks,
  Loader2,
  Mic2,
  Phone,
  Plus,
  Rocket,
  ShieldQuestion,
  Sparkles,
  UserRound,
  Wand2,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useAdminSchools } from '../hooks/useAdmin';
import { useAuth } from '../hooks/useAuth';
import { useCreateCustomScenario } from '../hooks/useScenarios';
import { canUseCustomScenarios } from '../utils/plans';

const VOICE_OPTIONS = [
  { id: 'Elliot', label: 'Elliot', tone: 'friendly male' },
  { id: 'Paige', label: 'Paige', tone: 'warm female' },
  { id: 'Rohan', label: 'Rohan', tone: 'measured male' },
  { id: 'Cole', label: 'Cole', tone: 'direct male' },
  { id: 'Savannah', label: 'Savannah', tone: 'upbeat female' },
  { id: 'Leah', label: 'Leah', tone: 'calm female' },
  { id: 'Harry', label: 'Harry', tone: 'clear male' },
  { id: 'Spencer', label: 'Spencer', tone: 'casual male' },
  { id: 'Layla', label: 'Layla', tone: 'bright female' },
  { id: 'Sagar', label: 'Sagar', tone: 'steady male' },
  { id: 'Neil', label: 'Neil', tone: 'neutral male' },
  { id: 'Sid', label: 'Sid', tone: 'confident male' },
  { id: 'Naina', label: 'Naina', tone: 'thoughtful female' },
];

const CONTEXT_TYPES = [
  { id: 'inbound_call', label: 'They are calling in', prompt: 'You are calling the school.' },
  { id: 'outbound_callback', label: 'Staff is calling them', prompt: 'You are receiving a call from the school.' },
  { id: 'in_person', label: 'In person', prompt: 'You are speaking with staff in person.' },
];

const CALL_TYPES = [
  { id: 'new_lead_inquiry', label: 'New lead inquiry' },
  { id: 'lead_follow_up', label: 'Lead follow-up' },
  { id: 'trial_booking', label: 'Trial booking' },
  { id: 'trial_follow_up', label: 'Trial follow-up' },
  { id: 'enrollment', label: 'Enrollment' },
  { id: 'member_support', label: 'Member support' },
  { id: 'retention_cancellation', label: 'Retention / cancellation' },
  { id: 'renewal_upgrade', label: 'Renewal / upgrade' },
];

const PRACTICE_TEMPLATES = [
  {
    callType: 'new_lead_inquiry',
    label: 'New lead inquiry',
    moves: [
      'Ask what got them interested in martial arts right now.',
      "Find out the student's age, experience level, and main goal.",
      'Explain the program in simple benefits instead of listing features.',
      'Invite them to a trial class with a specific day and time.',
      'Confirm contact details and the next step before ending the call.',
    ],
  },
  {
    callType: 'lead_follow_up',
    label: 'Lead follow-up',
    moves: [
      'Reference the inquiry so the call does not feel cold.',
      'Ask what they were hoping to find for themselves or their child.',
      'Handle hesitation about timing, schedule, or price.',
      'Make the trial class feel low-pressure and easy to attend.',
      'Book a specific next step before the call ends.',
    ],
  },
  {
    callType: 'trial_booking',
    label: 'Trial booking',
    moves: [
      'Confirm who the trial is for and what they want to get from class.',
      'Recommend the best trial class based on age, level, and goal.',
      'Explain what to expect at the first class in simple terms.',
      'Handle schedule or nervousness concerns without pressure.',
      'Book a specific trial time and confirm arrival details.',
    ],
  },
  {
    callType: 'trial_follow_up',
    label: 'Trial follow-up',
    moves: [
      'Ask how the trial class felt for the student or parent.',
      'Connect their feedback to the right next step.',
      'Address any concern about schedule, fit, or commitment.',
      'Explain enrollment options clearly without overwhelming them.',
      'Ask for a clear decision or schedule the next follow-up.',
    ],
  },
  {
    callType: 'enrollment',
    label: 'Enrollment',
    moves: [
      'Confirm the student goal before discussing membership options.',
      'Recommend the best program based on the student and family needs.',
      'Explain pricing and commitment clearly and confidently.',
      'Handle hesitation without discounting or pressuring.',
      'Close with a clear enrollment step and start date.',
    ],
  },
  {
    callType: 'member_support',
    label: 'Member support',
    moves: [
      'Let the member explain the issue without interrupting.',
      'Clarify the specific schedule, billing, or program question.',
      'Give a clear answer without overexplaining.',
      'Check whether the solution works for the member.',
      'End with a clear confirmation of what will happen next.',
    ],
  },
  {
    callType: 'retention_cancellation',
    label: 'Retention / cancellation',
    moves: [
      'Ask what changed before trying to save the membership.',
      'Acknowledge the concern without sounding defensive.',
      'Find out whether the issue is schedule, cost, motivation, or fit.',
      'Offer a practical option such as a pause, schedule change, or program adjustment.',
      'Confirm the agreed next step clearly.',
    ],
  },
  {
    callType: 'renewal_upgrade',
    label: 'Renewal / upgrade',
    moves: [
      'Ask what the student is enjoying most in their current program.',
      'Confirm what the family wants the next stage of training to do.',
      'Explain the upgrade in terms of confidence, challenge, and long-term progress.',
      'Address schedule or price concerns without rushing the decision.',
      'Recommend a clear next step, such as trying the next class this week.',
    ],
  },
];

const OBJECTION_TEMPLATES = [
  {
    callType: 'new_lead_inquiry',
    label: 'New lead inquiry',
    objections: [
      'I am just looking around right now.',
      'How much does it cost?',
      'I need to check our schedule first.',
      'My child is nervous about trying something new.',
      'We are comparing a few schools.',
    ],
  },
  {
    callType: 'lead_follow_up',
    label: 'Lead follow-up',
    objections: [
      'I forgot I filled out the form.',
      'We are not ready to start yet.',
      'The class times might not work for us.',
      'I need to talk with my spouse first.',
      'Can you just send me the prices?',
    ],
  },
  {
    callType: 'trial_booking',
    label: 'Trial booking',
    objections: [
      'We are busy this week.',
      'My child might be too shy to try it.',
      'Do we have to commit after the trial?',
      'I am not sure which class is right.',
      'I need to know the price before booking.',
    ],
  },
  {
    callType: 'trial_follow_up',
    label: 'Trial follow-up',
    objections: [
      'We liked it, but I am not sure we can commit.',
      'The schedule may be hard for us.',
      'It felt a little expensive.',
      'My child wants to think about it.',
      'We want to try another place before deciding.',
    ],
  },
  {
    callType: 'enrollment',
    label: 'Enrollment',
    objections: [
      'The membership is more than we expected.',
      'I do not want to sign a long agreement.',
      'I need to check with my spouse first.',
      'I am worried we will not use it enough.',
      'Can we start later instead of right away?',
    ],
  },
  {
    callType: 'member_support',
    label: 'Member support',
    objections: [
      'That class time does not work for us anymore.',
      'I do not understand this charge.',
      'My child is not enjoying class lately.',
      'We missed several classes and feel behind.',
      'I need this fixed before we keep coming.',
    ],
  },
  {
    callType: 'retention_cancellation',
    label: 'Retention / cancellation',
    objections: [
      'We need to cancel because the schedule is too hard.',
      'It is too expensive right now.',
      'My child lost interest.',
      'We are not seeing enough progress.',
      'We are moving to another activity.',
    ],
  },
  {
    callType: 'renewal_upgrade',
    label: 'Renewal / upgrade',
    objections: [
      'I am not sure the upgrade is necessary yet.',
      'The new class time may not work.',
      'It costs more than we planned.',
      'My child is comfortable where they are.',
      'I need to understand what changes before deciding.',
    ],
  },
];

const STEPS = [
  { title: 'Brief', icon: Rocket },
  { title: 'Caller', icon: Bot },
  { title: 'Practice', icon: ListChecks },
  { title: 'Objections', icon: ShieldQuestion },
  { title: 'Launch', icon: Sparkles },
];

const DEFAULT_FORM = {
  title: '',
  callType: 'new_lead_inquiry',
  contextType: 'inbound_call',
  goal: '',
  topics: [],
  characterName: '',
  characterRole: '',
  openingLine: '',
  staffPractice: ['', '', '', '', ''],
  objections: ['', '', '', '', ''],
  objectionCounts: { easy: 1, medium: 2, hard: 2 },
  voiceId: 'Elliot',
  schoolId: null,
};

const OBJECTION_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5];
const MAX_STAFF_PRACTICE_MOVES = 8;

const STEP_WARNING_COPY = [
  {
    title: 'Finish the brief first',
    body: 'Add a scenario name and purpose so the AI knows what this roleplay is about.',
    toastTitle: 'Brief is missing a few details',
  },
  {
    title: 'Finish the caller setup first',
    body: 'Add who the caller is and what they say first so the roleplay starts naturally.',
    toastTitle: 'Caller setup is not ready yet',
  },
  {
    title: 'Add at least one practice move',
    body: 'Give staff one clear behavior to practice so the scorecard has something concrete to grade.',
    toastTitle: 'Practice needs one clear move',
  },
  {
    title: 'Add at least one objection',
    body: 'Give the caller one realistic concern so the conversation does not feel too easy.',
    toastTitle: 'Objections need one realistic concern',
  },
  {
    title: 'Review the launch settings',
    body: 'Choose the final settings before creating the scenario.',
    toastTitle: 'Launch settings need attention',
  },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function compactList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function makeTopic(value) {
  return String(value || '').trim().slice(0, 40);
}

function buildObjectionFocus(objections) {
  const pool = compactList(objections);
  return {
    easy: pool,
    medium: pool,
    hard: pool,
  };
}

function getCallTypeLabel(callType) {
  return CALL_TYPES.find((item) => item.id === callType)?.label || 'New lead inquiry';
}

function makeDescription(form) {
  const title = form.title.trim();
  const name = form.characterName.trim() || 'the caller';
  const callType = getCallTypeLabel(form.callType).toLowerCase();
  const goal = form.goal.trim() || `Practice a ${callType} scenario.`;
  return title ? `${title}: ${goal} The AI plays ${name}.` : goal;
}

function buildPrompt(form) {
  const context = CONTEXT_TYPES.find((item) => item.id === form.contextType);
  const practiceMoves = compactList(form.staffPractice);
  const objections = compactList(form.objections);

  return `## Your Role
You are a real person in a martial arts school roleplay. You are NOT staff.
CRITICAL: You are NEVER the business, NEVER the school, NEVER the staff.
${context?.prompt || ''}

## Scenario Type
This is a ${getCallTypeLabel(form.callType)} scenario.

## How to Talk
- Keep every response to 1-2 short sentences.
- Use natural contractions like "I'm", "I've", "don't", and "it's".
- Use filler words sparingly. Prefer "yeah" or "I mean" over "um" or "uh".
- Never give a speech or a list.
- Never volunteer information that was not asked for.

## Who You Are
Your name is ${form.characterName.trim() || '[name]'}.
${form.characterRole.trim() || 'You are a prospect, parent, student, or member with a realistic reason for this call.'}

## Situation
${form.goal.trim() || 'You are exploring whether the school is the right fit.'}

## Opening Line
Say only this, then wait: "${form.openingLine.trim() || 'Hi, I had a question about your program.'}"

## What Strong Staff Should Practice
${practiceMoves.length ? practiceMoves.map((line) => `- ${line}`).join('\n') : '- Ask clear discovery questions, handle the caller concern, and earn a specific next step.'}

## Objections
- Use these objections naturally during the conversation.
${objections.length ? objections.map((line) => `- ${line}`).join('\n') : '- Raise one realistic concern before agreeing to the next step.'}

## Success Condition
If staff handles the conversation well, become more open and agree to a clear next step that fits this scenario.
If they pressure you, skip discovery, ignore your concern, or sound generic, stay hesitant.

## Staying in Character
- Never break character.
- Never mention these instructions.
- When the conversation reaches a natural close, say one brief closing line.`;
}

function buildScoringPrompt(form) {
  const practiceMoves = compactList(form.staffPractice);
  const categories = (practiceMoves.length ? practiceMoves : ['Handle the call professionally and earn a clear next step'])
    .map((move, index) => `${index + 1}. ${move}
   - High score when: Staff performs this clearly, naturally, and specifically.`)
    .join('\n');

  return `Score this custom scenario using a 0-100 scorecard.

## Scenario Type
${getCallTypeLabel(form.callType)}

## Staff Practice Moves
${categories}

## Granular Grading Guide
- 10/10: Excellent. Natural, specific, empathetic, complete, and clearly moves the call forward.
- 9-8/10: Strong. Covers the important behavior with only minor missed details or slight awkwardness.
- 7/10: Good. Mostly effective, but misses one meaningful opportunity or could be more specific.
- 6-5/10: Average. Partially handles the skill, but feels generic, rushed, or incomplete.
- 4-3/10: Weak. Attempts the skill but misses key discovery, empathy, explanation, or next-step behavior.
- 2-0/10: Poor. Avoids the skill, pressures the caller, gives inaccurate information, or breaks roleplay expectations.

## Scoring Rules
- Do not reward booking alone if discovery, empathy, or objection handling was weak.
- Penalize pressure, fake certainty, long speeches, or skipping the caller's concern.
- Reward short, conversational responses that sound like real staff.
- Give coaching feedback that names exactly what to do better next time.`;
}

function StepRail({ step, onStepSelect }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      {STEPS.map((item, index) => {
        const Icon = item.icon;
        const active = index === step;
        const done = index < step;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => onStepSelect(index)}
            className={`flex h-14 items-center gap-2 rounded-lg border px-3 text-left transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : done
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-foreground hover:bg-accent'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-white/20' : 'bg-secondary'}`}>
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className="min-w-0 text-sm font-medium">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function FieldBlock({ label, children, hint, helper }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {helper && <p className="text-sm text-muted-foreground">{helper}</p>}
      {children}
      {hint && <p className="text-sm font-medium text-destructive">{hint}</p>}
    </div>
  );
}

function LineListEditor({ values, onChange, placeholder }) {
  const updateValue = (index, value) => {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <Badge variant="secondary" className="w-fit rounded-md">{index + 1}</Badge>
          <Input
            value={value}
            onChange={(event) => updateValue(index, event.target.value)}
            placeholder={placeholder}
          />
        </div>
      ))}
    </div>
  );
}

function PreviewPanel({ form }) {
  const prompt = useMemo(() => buildPrompt(form), [form]);
  const completion = [
    form.title,
    form.goal,
    form.characterName,
    form.characterRole,
    form.openingLine,
    compactList(form.staffPractice).length ? 'practice' : '',
    compactList(form.objections).length ? 'objections' : '',
  ].filter((value) => String(value || '').trim()).length;

  return (
    <aside className="space-y-4">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI blueprint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Build progress</span>
                <span>{Math.round((completion / 7) * 100)}%</span>
              </div>
            <Progress value={(completion / 7) * 100} />
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-sm font-medium">{form.title || 'Untitled AI roleplay'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{form.characterName || 'Caller'} will start with:</p>
            <p className="mt-2 text-sm">"{form.openingLine || 'Opening line appears here.'}"</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-secondary/40 p-2">
              <p className="font-semibold">Easy</p>
              <p className="mt-1 text-muted-foreground">1 concern</p>
            </div>
            <div className="rounded-lg bg-secondary/40 p-2">
              <p className="font-semibold">Medium</p>
              <p className="mt-1 text-muted-foreground">2 concerns</p>
            </div>
            <div className="rounded-lg bg-secondary/40 p-2">
              <p className="font-semibold">Hard</p>
              <p className="mt-1 text-muted-foreground">2 blockers</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Scorecard</p>
              <Badge variant="secondary" className="rounded-md">
                Auto
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Generated automatically from the staff practice moves.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Generated prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">
            {prompt}
          </pre>
        </CardContent>
      </Card>
    </aside>
  );
}

function AiBuildPanel({ form, step }) {
  const prompt = useMemo(() => buildPrompt(form), [form]);
  const buildPercent = Math.round(((step + 1) / STEPS.length) * 100);
  const practiceCount = compactList(form.staffPractice).length;
  const objectionCount = compactList(form.objections).length;

  return (
    <aside className="space-y-4">
      <Card className="overflow-hidden rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            AI build v3
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary p-5 text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.24),transparent_28%)]" />
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/15" />
            <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full border border-white/10" />

            <div className="relative z-10 flex items-center justify-between">
              <Badge className="rounded-md bg-white text-primary hover:bg-white">Build {buildPercent}%</Badge>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <CircuitBoard className="h-4 w-4 text-white" />
                {STEPS[step].title}
              </div>
            </div>

            <div className="relative z-10 mt-7 rounded-lg border border-white/20 bg-white p-4 text-slate-950 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                  <Phone className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-semibold uppercase text-primary">AI caller preview</p>
                    <Badge variant={step >= 5 ? 'default' : 'secondary'} className="rounded-md">
                      {step >= 5 ? 'Ready' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="mt-2 truncate text-2xl font-bold">{form.title || 'Untitled scenario'}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{form.characterName || 'New caller'} / {form.voiceId}</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-20 items-center gap-1">
                  {[24, 38, 18, 54, 70, 34, 46, 28, 62, 84, 42, 22, 58, 74, 30, 48, 66, 36].map((height, index) => (
                    <span
                      key={index}
                      className={`w-full rounded-full transition-all duration-500 ${index / 3 <= step ? 'bg-primary' : 'bg-slate-200'}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${buildPercent}%` }} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  { label: 'Caller', icon: UserRound, ready: step >= 1, value: form.characterRole || 'Role pending' },
                  { label: 'Call type', icon: Phone, ready: step >= 0, value: getCallTypeLabel(form.callType) },
                  { label: 'Practice', icon: ListChecks, ready: step >= 2, value: practiceCount ? `${practiceCount} moves` : 'Pending' },
                  { label: 'Objections', icon: ShieldQuestion, ready: step >= 3, value: objectionCount ? `${objectionCount} listed` : 'Pending' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`rounded-lg border p-3 transition-all duration-500 ${
                        item.ready ? 'border-primary/30 bg-blue-50 text-slate-950' : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${item.ready ? 'text-primary' : 'text-slate-400'}`} />
                        <p className="text-xs font-semibold">{item.label}</p>
                      </div>
                      <p className="mt-2 truncate text-xs">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-sm font-medium">Live blueprint</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {prompt.length > 420 ? `${prompt.slice(0, 420)}...` : prompt}
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

export function CustomScenariosV2Page({ variant = 'v3' }) {
  const navigate = useNavigate();
  const { isGlobalAdmin, profile } = useAuth();
  const createScenario = useCreateCustomScenario();
  const { data: schools } = useAdminSchools(isGlobalAdmin);
  const customScenariosEnabled = isGlobalAdmin || canUseCustomScenarios(profile?.school);
  const isV3 = variant === 'v3';
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const setObjectionCount = (difficulty, value) => {
    setForm((current) => ({
      ...current,
      objectionCounts: {
        ...current.objectionCounts,
        [difficulty]: parseInt(value, 10),
      },
    }));
  };

  const getStepErrors = (targetStep) => {
    const nextErrors = {};
    if (targetStep === 0) {
      if (!form.title.trim()) nextErrors.title = 'Add a short name for this roleplay.';
      if (!form.goal.trim()) nextErrors.goal = 'Tell the AI what the staff member is practicing.';
    }
    if (targetStep === 1) {
      if (!form.characterName.trim()) nextErrors.characterName = 'Give the caller a name staff can refer to.';
      if (!form.characterRole.trim()) nextErrors.characterRole = 'Add one sentence about who this caller is.';
      if (!form.openingLine.trim()) nextErrors.openingLine = 'Write the first thing the caller should say.';
    }
    if (targetStep === 2 && compactList(form.staffPractice).length === 0) {
      nextErrors.staffPractice = 'Add one behavior staff should practice on this call.';
    }
    if (targetStep === 3 && compactList(form.objections).length === 0) {
      nextErrors.objections = 'Add one realistic concern the caller might raise.';
    }
    if (targetStep === 3 && compactList(form.objections).length > 0) {
      const counts = form.objectionCounts || {};
      if (['easy', 'medium', 'hard'].some((difficulty) => Number(counts[difficulty]) > 0) === false) {
        nextErrors.objectionCounts = 'Choose at least one objection for a difficulty level.';
      }
    }
    return nextErrors;
  };

  const validateStep = (targetStep = step) => {
    const nextErrors = getStepErrors(targetStep);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const showStepBlockedToast = (stepErrors, blockedStep = step, targetStep = null) => {
    const copy = STEP_WARNING_COPY[blockedStep] || STEP_WARNING_COPY[0];
    const missingCount = Object.keys(stepErrors).length;
    const target = targetStep == null ? 'the next step' : STEPS[targetStep]?.title;
    const description = target
      ? `Add ${missingCount === 1 ? 'the missing detail' : 'the missing details'} before moving to ${target}.`
      : copy.body;

    toast.error(copy.toastTitle, {
      description,
    });
  };

  const findFirstIncompleteStep = (targetStep) => {
    for (let index = 0; index < targetStep; index += 1) {
      const stepErrors = getStepErrors(index);
      if (Object.keys(stepErrors).length > 0) {
        return { index, stepErrors };
      }
    }

    return null;
  };

  const goToStep = (targetStep) => {
    if (targetStep <= step) {
      setErrors({});
      setStep(targetStep);
      return;
    }

    const incompleteStep = findFirstIncompleteStep(targetStep);
    if (incompleteStep) {
      setErrors(incompleteStep.stepErrors);
      setStep(incompleteStep.index);
      showStepBlockedToast(incompleteStep.stepErrors, incompleteStep.index, targetStep);
      return;
    }

    setErrors({});
    setStep(targetStep);
  };

  const nextStep = () => {
    const stepErrors = getStepErrors(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      showStepBlockedToast(stepErrors, step, step + 1);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const submit = async () => {
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        showStepBlockedToast(getStepErrors(index), index, STEPS.length - 1);
        return;
      }
    }

    const payload = {
      slug: slugify(form.title),
      title: form.title.trim(),
      description: makeDescription(form).slice(0, 1000),
      contextType: form.contextType,
      characterName: form.characterName.trim(),
      characterBlurb: form.characterRole.trim().slice(0, 500),
      topics: [getCallTypeLabel(form.callType), ...compactList(form.staffPractice).slice(0, 5)]
        .map(makeTopic)
        .filter(Boolean)
        .slice(0, 6),
      schoolId: isGlobalAdmin ? form.schoolId : undefined,
      characterPrompt: buildPrompt(form),
      openingLine: form.openingLine.trim(),
      voiceId: form.voiceId,
      voiceProvider: 'vapi',
      scoringPrompt: buildScoringPrompt(form),
      objectionFocus: buildObjectionFocus(form.objections),
      objectionCounts: form.objectionCounts,
      isActive: true,
    };

    try {
      await createScenario.mutateAsync(payload);
      toast.success('AI scenario created.');
      navigate('/admin/scenarios');
    } catch (error) {
      toast.error(error.message || 'Could not create scenario.');
    }
  };

  const currentErrorMessages = Object.values(errors).filter(Boolean);
  const currentWarningCopy = STEP_WARNING_COPY[step] || STEP_WARNING_COPY[0];
  const practiceTemplates = useMemo(() => {
    const selected = PRACTICE_TEMPLATES.find((template) => template.callType === form.callType);
    const rest = PRACTICE_TEMPLATES.filter((template) => template.callType !== form.callType);
    return selected ? [selected, ...rest] : PRACTICE_TEMPLATES;
  }, [form.callType]);
  const objectionTemplates = useMemo(() => {
    const selected = OBJECTION_TEMPLATES.find((template) => template.callType === form.callType);
    const rest = OBJECTION_TEMPLATES.filter((template) => template.callType !== form.callType);
    return selected ? [selected, ...rest] : OBJECTION_TEMPLATES;
  }, [form.callType]);

  if (!customScenariosEnabled) {
    return (
      <DashboardLayout title={isV3 ? 'Scenario Builder v3' : 'Scenario Builder'}>
        <Card className="rounded-lg">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold">Custom scenarios are not enabled for this plan.</p>
            <p className="mt-2 text-sm text-muted-foreground">Upgrade the school plan to create school-specific AI roleplays.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isV3 ? 'Scenario Builder v3' : 'Scenario Builder'}>
      <div className="space-y-6 text-foreground">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 gap-1 rounded-md">
              <Sparkles className="h-3.5 w-3.5" />
              Custom Scenarios v3
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Assemble your AI roleplay
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Fill out the same simple brief: scenario, caller, what staff should practice, objections, and voice.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/scenarios')} className="gap-2 text-foreground">
            Existing scenarios
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <StepRail step={step} onStepSelect={goToStep} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = STEPS[step].icon;
                  return <Icon className="h-5 w-5 text-primary" />;
                })()}
                {STEPS[step].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentErrorMessages.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">{currentWarningCopy.title}</p>
                    <p className="mt-1 text-sm">{currentWarningCopy.body}</p>
                  </div>
                </div>
              )}

              {step === 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Scenario name" hint={errors.title}>
                      <Input value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Adult lead follow-up" />
                    </FieldBlock>
                    <FieldBlock label="Call type">
                      <Select value={form.callType} onValueChange={(value) => setField('callType', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CALL_TYPES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldBlock>
                  </div>
                  <FieldBlock label="Purpose" hint={errors.goal}>
                    <Textarea
                      value={form.goal}
                      onChange={(event) => setField('goal', event.target.value)}
                      rows={4}
                      placeholder="What is your team practicing, and what does a good outcome look like?"
                    />
                  </FieldBlock>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Caller name" hint={errors.characterName}>
                      <Input value={form.characterName} onChange={(event) => setField('characterName', event.target.value)} placeholder="Morgan" />
                    </FieldBlock>
                    <FieldBlock label="Are they calling in, or are we calling them?">
                      <Select value={form.contextType} onValueChange={(value) => setField('contextType', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONTEXT_TYPES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldBlock>
                  </div>
                  <FieldBlock label="Who is the caller?" hint={errors.characterRole}>
                    <Textarea
                      value={form.characterRole}
                      onChange={(event) => setField('characterRole', event.target.value)}
                      rows={4}
                      placeholder="Name plus one line of context, like: A parent calling to cancel a membership."
                    />
                  </FieldBlock>
                  <FieldBlock label="Opening line" hint={errors.openingLine}>
                    <Input
                      value={form.openingLine}
                      onChange={(event) => setField('openingLine', event.target.value)}
                      placeholder="Hi, I was calling to ask about your kids program."
                    />
                  </FieldBlock>
                </>
              )}

              {step === 2 && (
                <>
                  <FieldBlock
                    label="What should staff practice on this call?"
                    helper="Add one key move per line. Each one becomes a scoring category."
                    hint={errors.staffPractice}
                  >
                    <div className="rounded-lg border border-border bg-secondary/20 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">Start with a template</p>
                          <p className="text-xs text-muted-foreground">Pick one, then edit the lines to match this exact call.</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {practiceTemplates.map((template) => (
                          <Button
                            key={template.callType}
                            type="button"
                            variant={template.callType === form.callType ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setField('staffPractice', template.moves)}
                          >
                            {template.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <LineListEditor
                      values={form.staffPractice}
                      onChange={(values) => setField('staffPractice', values)}
                      placeholder="One observable action, like: Ask why they are interested before discussing price."
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {form.staffPractice.length} of {MAX_STAFF_PRACTICE_MOVES} possible scoring categories
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setField('staffPractice', [...form.staffPractice, ''])}
                        disabled={form.staffPractice.length >= MAX_STAFF_PRACTICE_MOVES}
                      >
                        <Plus className="h-4 w-4" />
                        Add practice move
                      </Button>
                    </div>
                  </FieldBlock>
                </>
              )}

              {step === 3 && (
                <>
                  <FieldBlock
                    label="List of 5 objections"
                    helper="Add likely concerns the caller might raise. The AI will use them naturally during the call."
                    hint={errors.objections || errors.objectionCounts}
                  >
                    <div className="rounded-lg border border-border bg-secondary/20 p-3">
                      <div>
                        <p className="text-sm font-medium">Start with common objections</p>
                        <p className="text-xs text-muted-foreground">Pick one, then edit the concerns to match this caller.</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {objectionTemplates.map((template) => (
                          <Button
                            key={template.callType}
                            type="button"
                            variant={template.callType === form.callType ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setField('objections', template.objections)}
                          >
                            {template.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/20 p-3">
                      <p className="text-sm font-medium">Objections by difficulty</p>
                      <p className="text-xs text-muted-foreground">Choose how many objections the AI should use from this list on each difficulty.</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          { id: 'easy', label: 'Easy' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'hard', label: 'Hard' },
                        ].map((difficulty) => (
                          <div key={difficulty.id} className="space-y-1.5">
                            <Label>{difficulty.label}</Label>
                            <Select
                              value={String(form.objectionCounts?.[difficulty.id] ?? 0)}
                              onValueChange={(value) => setObjectionCount(difficulty.id, value)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {OBJECTION_COUNT_OPTIONS.map((count) => (
                                  <SelectItem key={count} value={String(count)}>
                                    {count === 1 ? '1 objection' : `${count} objections`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                    <LineListEditor
                      values={form.objections}
                      onChange={(values) => setField('objections', values)}
                      placeholder="A likely concern the caller would raise."
                    />
                  </FieldBlock>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Voice">
                      <Select value={form.voiceId} onValueChange={(value) => setField('voiceId', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VOICE_OPTIONS.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>{voice.label} - {voice.tone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldBlock>
                    {isGlobalAdmin ? (
                      <FieldBlock label="Visible to">
                        <Select
                          value={form.schoolId == null ? 'all' : String(form.schoolId)}
                          onValueChange={(value) => setField('schoolId', value === 'all' ? null : parseInt(value, 10))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All schools</SelectItem>
                            {(schools ?? []).map((school) => (
                              <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                    ) : (
                      <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                        <p className="font-medium">Visible to {profile?.school?.name || 'your school'}</p>
                        <p className="mt-1 text-muted-foreground">School admins create scenarios for their assigned school.</p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Ready to launch</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This creates an active custom scenario that appears on the Practice Call page for eligible users.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={submit} disabled={createScenario.isPending} className="gap-2">
                    {createScenario.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
                    Create AI scenario
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isV3 ? <AiBuildPanel form={form} step={step} /> : <PreviewPanel form={form} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

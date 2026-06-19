import { useState } from 'react';
import { useAllCustomScenarios, useBuiltInScenarios, useCreateCustomScenario, useUpdateCustomScenario, useDeleteCustomScenario, useToggleCustomScenario, useUpdateBuiltInScenario, usePublishBuiltInScenario, useResetBuiltInScenario } from '../hooks/useScenarios';
import { useAdminSchools } from '../hooks/useAdmin';
import { useAuth } from '../hooks/useAuth';
import { canUseCustomScenarios } from '../utils/plans';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, CheckCircle2, Loader2, Lock, Plus, Pencil, RotateCcw, Trash2, Drama, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast } from 'sonner';

const VOICE_OPTIONS = [
  { id: 'Elliot', label: 'Elliot (Male, Canadian)' },
  { id: 'Emma', label: 'Emma (Female, American)' },
  { id: 'Rohan', label: 'Rohan (Male, Indian American)' },
  { id: 'Nico', label: 'Nico (Male, American)' },
  { id: 'Savannah', label: 'Savannah (Female, American)' },
  { id: 'Clara', label: 'Clara (Female, American)' },
  { id: 'Godfrey', label: 'Godfrey (Male, American)' },
  { id: 'Kai', label: 'Kai (Male, American)' },
];

const CONTEXT_TYPES = [
  { id: 'inbound_call', label: 'Inbound Call' },
  { id: 'outbound_callback', label: 'Outbound Callback' },
  { id: 'in_person', label: 'In-Person' },
];

const PROMPT_TEMPLATE = `## Who You Are
Your name is [NAME]. You're [AGE] years old. [BRIEF BACKSTORY].

## Your Opening Line
Say only this, then wait: "[WHAT THEY SAY FIRST]"

## Your Situation (only reveal when asked)
- [DETAIL 1]
- [DETAIL 2]

## How You React to Specific Topics
- **If they ask about [TOPIC]**: [HOW YOU RESPOND]`;

const DEFAULT_FORM = {
  title: '', description: '', contextType: 'inbound_call', characterName: '',
  characterBlurb: '', topics: [], schoolId: null, characterPrompt: PROMPT_TEMPLATE,
  openingLine: '', voiceId: 'Elliot', voiceProvider: 'vapi', scoringPrompt: '', isActive: true,
};

const DEFAULT_BUILT_IN_FORM = {
  title: '', description: '', systemPromptBase: '', firstMessage: '',
  voiceId: 'Elliot', voiceProvider: 'vapi', scoringRubricType: 'inbound',
  scoringCategories: [], objectionFocus: { easy: [], medium: [], hard: [] }, status: 'draft',
};

const SCORE_BANDS = ['10', '8-9', '7-8', '5-6', '3-4', '0-2'];

function normalizeScoringCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((category) => ({
    name: category?.name || '',
    weight: Number(category?.weight || 0),
    anchors: SCORE_BANDS.reduce((anchors, band) => ({
      ...anchors,
      [band]: category?.anchors?.[band] || '',
    }), {}),
  }));
}

function normalizeObjectionFocus(objectionFocus) {
  return {
    easy: Array.isArray(objectionFocus?.easy) ? objectionFocus.easy : [],
    medium: Array.isArray(objectionFocus?.medium) ? objectionFocus.medium : [],
    hard: Array.isArray(objectionFocus?.hard) ? objectionFocus.hard : [],
  };
}

function parseObjectionFocus(objectionFocus) {
  return {
    easy: (Array.isArray(objectionFocus.easy) ? objectionFocus.easy : []).map((line) => String(line).trim()).filter(Boolean),
    medium: (Array.isArray(objectionFocus.medium) ? objectionFocus.medium : []).map((line) => String(line).trim()).filter(Boolean),
    hard: (Array.isArray(objectionFocus.hard) ? objectionFocus.hard : []).map((line) => String(line).trim()).filter(Boolean),
  };
}

const REQUIRED_FIELDS = {
  title: 'Title',
  characterName: 'Character name',
  description: 'Description',
  openingLine: 'Opening line',
  characterPrompt: 'Character prompt',
  voiceId: 'Voice',
};

function validateScenarioForm(form) {
  return Object.entries(REQUIRED_FIELDS).reduce((errors, [field, label]) => {
    if (!String(form[field] ?? '').trim()) {
      errors[field] = `${label} is required.`;
    }
    return errors;
  }, {});
}

export function CustomScenariosPage() {
  const { isGlobalAdmin, profile } = useAuth();
  const customScenariosEnabled = isGlobalAdmin || canUseCustomScenarios(profile?.school);
  const [editingScenario, setEditingScenario] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showScoringPrompt, setShowScoringPrompt] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [adminScenarioTab, setAdminScenarioTab] = useState('built-in');
  const [editingBuiltIn, setEditingBuiltIn] = useState(null);
  const [builtInForm, setBuiltInForm] = useState(DEFAULT_BUILT_IN_FORM);

  const { data: scenarios, isLoading } = useAllCustomScenarios(customScenariosEnabled);
  const { data: builtInScenarios, isLoading: builtInLoading } = useBuiltInScenarios(isGlobalAdmin);
  const { data: schools } = useAdminSchools(isGlobalAdmin);

  const createMutation = useCreateCustomScenario();
  const updateMutation = useUpdateCustomScenario();
  const deleteMutation = useDeleteCustomScenario();

  const toggleActiveMutation = useToggleCustomScenario();
  const updateBuiltInMutation = useUpdateBuiltInScenario();
  const publishBuiltInMutation = usePublishBuiltInScenario();
  const resetBuiltInMutation = useResetBuiltInScenario();

  const addTopic = () => {
    const val = topicInput.trim();
    if (!val || form.topics.length >= 6 || form.topics.includes(val)) { setTopicInput(''); return; }
    setForm((f) => ({ ...f, topics: [...f.topics, val] }));
    setTopicInput('');
  };

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((errors) => {
      if (!errors[field]) return errors;
      const next = { ...errors };
      delete next[field];
      return next;
    });
  };

  const openCreate = () => {
    if (!customScenariosEnabled) {
      toast.error('Custom scenarios are available on the AIOS plan.');
      return;
    }
    setForm(DEFAULT_FORM); setFieldErrors({}); setShowScoringPrompt(false); setTopicInput(''); setEditingScenario({});
  };
  const openEdit = (s) => {
    setForm({
      title: s.title, description: s.description, contextType: s.contextType, characterName: s.characterName,
      characterBlurb: s.characterBlurb || '', topics: Array.isArray(s.topics) ? s.topics : [],
      schoolId: s.schoolId ?? null, characterPrompt: s.characterPrompt, openingLine: s.openingLine || '',
      voiceId: s.voiceId, voiceProvider: s.voiceProvider || 'vapi', scoringPrompt: s.scoringPrompt || '', isActive: s.isActive,
    });
    setFieldErrors({});
    setShowScoringPrompt(!!s.scoringPrompt);
    setTopicInput('');
    setEditingScenario(s);
  };

  const openBuiltInEdit = (s) => {
    setBuiltInForm({
      title: s.title || '',
      description: s.description || '',
      systemPromptBase: s.systemPromptBase || '',
      firstMessage: s.firstMessage || '',
      voiceId: s.voiceId || 'Elliot',
      voiceProvider: s.voiceProvider || 'vapi',
      scoringRubricType: s.scoringRubricType || 'inbound',
      scoringCategories: normalizeScoringCategories(s.scoringCategories),
      objectionFocus: normalizeObjectionFocus(s.objectionFocus),
      status: s.status || 'draft',
    });
    setEditingBuiltIn(s);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateScenarioForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error(`Please complete: ${Object.keys(errors).map((field) => REQUIRED_FIELDS[field] ?? field).join(', ')}`);
      return;
    }

    const data = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      characterName: form.characterName.trim(),
      characterPrompt: form.characterPrompt.trim(),
      characterBlurb: form.characterBlurb?.trim() || null,
      topics: form.topics.length > 0 ? form.topics : null,
      openingLine: form.openingLine.trim(),
      scoringPrompt: form.scoringPrompt?.trim() || null,
    };
    const handleError = (err) => {
      if (err.details?.length) {
        const nextErrors = Object.fromEntries(err.details.map((detail) => [detail.field, detail.message]));
        setFieldErrors(nextErrors);
        toast.error(`Please fix: ${err.details.map((detail) => detail.field).join(', ')}`);
        return;
      }
      toast.error(err.message);
    };
    if (editingScenario?.id) {
      updateMutation.mutate({ id: editingScenario.id, data }, { onSuccess: () => { setEditingScenario(null); toast.success('Scenario updated'); }, onError: handleError });
    } else {
      createMutation.mutate(data, { onSuccess: () => { setEditingScenario(null); toast.success('Scenario created'); }, onError: handleError });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isBuiltInSaving = updateBuiltInMutation.isPending || publishBuiltInMutation.isPending || resetBuiltInMutation.isPending;
  const builtInRubricWeightTotal = builtInForm.scoringCategories.reduce((sum, category) => sum + Number(category.weight || 0), 0);
  const builtInObjectionCounts = parseObjectionFocus(builtInForm.objectionFocus);
  const builtInObjectionsValid = builtInObjectionCounts.easy.length >= 1
    && builtInObjectionCounts.medium.length >= 1
    && builtInObjectionCounts.hard.length >= 1;

  const updateBuiltInCategory = (index, patch) => {
    setBuiltInForm((f) => ({
      ...f,
      scoringCategories: f.scoringCategories.map((category, i) => (
        i === index ? { ...category, ...patch } : category
      )),
    }));
  };

  const updateBuiltInAnchor = (index, band, value) => {
    setBuiltInForm((f) => ({
      ...f,
      scoringCategories: f.scoringCategories.map((category, i) => (
        i === index
          ? { ...category, anchors: { ...(category.anchors || {}), [band]: value } }
          : category
      )),
    }));
  };

  const addBuiltInCategory = () => {
    setBuiltInForm((f) => ({
      ...f,
      scoringCategories: [
        ...f.scoringCategories,
        {
          name: '',
          weight: 0,
          anchors: SCORE_BANDS.reduce((anchors, band) => ({ ...anchors, [band]: '' }), {}),
        },
      ],
    }));
  };

  const removeBuiltInCategory = (index) => {
    setBuiltInForm((f) => ({
      ...f,
      scoringCategories: f.scoringCategories.filter((_, i) => i !== index),
    }));
  };

  const updateBuiltInObjection = (difficulty, index, value) => {
    setBuiltInForm((f) => ({
      ...f,
      objectionFocus: {
        ...f.objectionFocus,
        [difficulty]: f.objectionFocus[difficulty].map((objection, i) => (
          i === index ? value : objection
        )),
      },
    }));
  };

  const addBuiltInObjection = (difficulty) => {
    setBuiltInForm((f) => ({
      ...f,
      objectionFocus: {
        ...f.objectionFocus,
        [difficulty]: [...f.objectionFocus[difficulty], ''],
      },
    }));
  };

  const removeBuiltInObjection = (difficulty, index) => {
    setBuiltInForm((f) => ({
      ...f,
      objectionFocus: {
        ...f.objectionFocus,
        [difficulty]: f.objectionFocus[difficulty].filter((_, i) => i !== index),
      },
    }));
  };

  const saveBuiltIn = (status = builtInForm.status) => {
    if (!editingBuiltIn?.slug) return;
    if (builtInForm.scoringCategories.length === 0) {
      toast.error('Add at least one scoring category.');
      return;
    }
    const scoringCategories = builtInForm.scoringCategories.map((category) => ({
      ...category,
      name: category.name.trim(),
      weight: Number(category.weight || 0),
      anchors: SCORE_BANDS.reduce((anchors, band) => ({
        ...anchors,
        [band]: category.anchors?.[band]?.trim() || '',
      }), {}),
    }));
    const objectionFocus = parseObjectionFocus(builtInForm.objectionFocus);
    if (objectionFocus.easy.length < 1 || objectionFocus.medium.length < 1 || objectionFocus.hard.length < 1) {
      toast.error('Add at least one objection for easy, medium, and hard.');
      return;
    }
    updateBuiltInMutation.mutate({
      slug: editingBuiltIn.slug,
      data: {
        status,
        title: builtInForm.title.trim(),
        description: builtInForm.description.trim(),
        systemPromptBase: builtInForm.systemPromptBase.trim(),
        firstMessage: builtInForm.firstMessage?.trim() || null,
        voiceId: builtInForm.voiceId,
        voiceProvider: builtInForm.voiceProvider || 'vapi',
        scoringRubricType: builtInForm.scoringRubricType,
        scoringCategories,
        objectionFocus,
      },
    }, {
      onSuccess: () => { setEditingBuiltIn(null); toast.success(status === 'published' ? 'Built-in scenario published' : 'Draft saved'); },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-2">
        {!customScenariosEnabled ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </span>
              <h2 className="text-lg font-semibold">Custom scenarios are available on AIOS</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Your school can still use the built-in scenario library. Upgrade to AIOS to create, edit, and practice custom roleplay scenarios.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
        {isGlobalAdmin && (
          <Tabs value={adminScenarioTab} onValueChange={setAdminScenarioTab}>
            <TabsList>
              <TabsTrigger value="built-in">Built-In Scenarios</TabsTrigger>
              <TabsTrigger value="custom">Custom Scenarios</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {isGlobalAdmin && adminScenarioTab === 'built-in' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Drama className="w-4 h-4 text-primary" />Built-In Scenarios
                {builtInScenarios && <span className="text-xs text-muted-foreground font-normal">({builtInScenarios.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {builtInLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="divide-y divide-border">
                  {(builtInScenarios ?? []).map((s) => (
                    <div key={s.slug} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{s.title}</span>
                          <Badge variant="outline" className="text-xs font-mono">{s.slug}</Badge>
                          <Badge className={s.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20 border' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 border'}>
                            {s.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                          {s.hasDatabaseOverride && <Badge variant="secondary">DB override</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{s.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.status !== 'published' && (
                          <Button variant="ghost" size="sm" onClick={() => publishBuiltInMutation.mutate(s.slug, { onSuccess: () => toast.success('Published'), onError: (err) => toast.error(err.message) })}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openBuiltInEdit(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => resetBuiltInMutation.mutate(s.slug, { onSuccess: () => toast.success('Reset to default'), onError: (err) => toast.error(err.message) })}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(!isGlobalAdmin || adminScenarioTab === 'custom') && (
          <>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {isGlobalAdmin
              ? 'Create platform-wide scenarios or limit them to a specific school.'
              : 'Create and manage training scenarios for your school.'}
          </p>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />New scenario</Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">How to write a good scenario</CardTitle>
              <Button type="button" size="sm" onClick={() => setGuideOpen(true)} className="gap-2 rounded-full px-4">
                <BookOpen className="h-4 w-4" />
                Field guide
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
            <div className="space-y-2">
              <p className="font-medium text-foreground">1. Define the situation</p>
              <p>Use the title and description to explain what the staff member is practicing.</p>
              <p className="rounded-lg bg-secondary/40 p-2 text-xs">
                Example: Birthday Party Inquiry - parent asking about party availability, pricing, and weekend options.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">2. Write the character</p>
              <p>Give the AI caller a name, motivation, concerns, and clear behavior rules.</p>
              <p className="rounded-lg bg-secondary/40 p-2 text-xs">
                Include what they reveal only when asked, what objections they raise, and how they respond to strong answers.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">3. Keep scoring optional</p>
              <p>Only add a custom scoring rubric when the default scorecard is not specific enough.</p>
              <p className="rounded-lg bg-secondary/40 p-2 text-xs">
                Example: score whether staff asked for the event date, built value, handled price, and asked for the booking.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Drama className="w-4 h-4 text-primary" />Scenarios
              {scenarios && <span className="text-xs text-muted-foreground font-normal">({scenarios.length})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : !scenarios || scenarios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No custom scenarios yet. The 6 built-in scenarios are always available.</p>
            ) : (
              <div className="divide-y divide-border">
                {scenarios.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{s.title}</span>
                        <Badge variant="outline" className="text-xs font-mono">{s.slug}</Badge>
                        <Badge className={s.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20 border' : 'bg-muted text-muted-foreground border'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="secondary">
                          {s.schoolId == null
                            ? 'All schools'
                            : schools?.find((school) => school.id === s.schoolId)?.name || 'This school'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{s.characterName} — {s.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })}>
                        {s.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget(s); setDeleteConfirmText(''); }} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
          </>
        )}
      </div>

      {/* Built-in scenario edit modal */}
      <Dialog open={editingBuiltIn !== null} onOpenChange={(open) => { if (!open) setEditingBuiltIn(null); }}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit built-in scenario</DialogTitle>
            <DialogDescription>
              Draft changes stay admin-only. Published changes affect every school.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="builtInTitle">Title</Label>
                <Input id="builtInTitle" value={builtInForm.title} onChange={(e) => setBuiltInForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={builtInForm.status} onValueChange={(val) => setBuiltInForm((f) => ({ ...f, status: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="builtInDescription">Description</Label>
              <Textarea id="builtInDescription" value={builtInForm.description} onChange={(e) => setBuiltInForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="builtInOpening">Opening line</Label>
                <Input id="builtInOpening" value={builtInForm.firstMessage} onChange={(e) => setBuiltInForm((f) => ({ ...f, firstMessage: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Voice</Label>
                <Select value={builtInForm.voiceId} onValueChange={(val) => setBuiltInForm((f) => ({ ...f, voiceId: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="builtInPrompt">System prompt</Label>
              <Textarea id="builtInPrompt" value={builtInForm.systemPromptBase} onChange={(e) => setBuiltInForm((f) => ({ ...f, systemPromptBase: e.target.value }))} rows={16} className="font-mono text-xs" />
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-secondary/10 p-4">
              <div>
                <Label>Objection pool</Label>
                <p className="text-xs text-muted-foreground">
                  Add each objection as its own item. For each call, the AI uses every objection listed for the selected difficulty.
                </p>
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <div key={difficulty} className="space-y-2 rounded-lg border border-border bg-background p-3">
                    <Label className="capitalize">{difficulty} ({parseObjectionFocus(builtInForm.objectionFocus)[difficulty].length || 0} used)</Label>
                    <div className="space-y-2">
                      {builtInForm.objectionFocus[difficulty].map((objection, index) => (
                        <div key={`${difficulty}-${index}`} className="grid gap-2 rounded-lg border border-border bg-secondary/20 p-2 sm:grid-cols-[1fr_auto]">
                          <Input value={objection}
                            onChange={(e) => updateBuiltInObjection(difficulty, index, e.target.value)}
                            className="h-auto min-h-10 rounded-md bg-background px-3 py-2 whitespace-normal"
                            placeholder="Price concern, schedule conflict, decision maker..." />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeBuiltInObjection(difficulty, index)}
                            className="shrink-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <p className="sm:col-span-2 text-xs leading-5 text-muted-foreground break-words">{objection || 'Empty objection'}</p>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => addBuiltInObjection(difficulty)} className="w-full gap-2">
                      <Plus className="w-4 h-4" />Add objection
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Scoring rubric type</Label>
                <Select value={builtInForm.scoringRubricType} onValueChange={(val) => setBuiltInForm((f) => ({ ...f, scoringRubricType: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="salesEnrollment">Sales Enrollment</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="cancellation">Cancellation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm text-muted-foreground">
                The AI scores the transcript against the scenario script/process and these score bands. The backend calculates the final 0-100 score from the category weights.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Scoring categories and score bands</Label>
                  <p className="text-xs text-muted-foreground">
                    Define what each score range means for this scenario. CAP can tighten these descriptions over time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={builtInRubricWeightTotal === 100 ? 'bg-green-500/10 text-green-500 border-green-500/20 border' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 border'}>
                    {builtInRubricWeightTotal}% total
                  </Badge>
                  <Button type="button" variant="outline" size="sm" onClick={addBuiltInCategory} className="gap-2">
                    <Plus className="w-4 h-4" />Add category
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {builtInForm.scoringCategories.map((category, index) => (
                  <div key={`${category.name}-${index}`} className="rounded-lg border border-border bg-background p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
                      <div className="space-y-1.5">
                        <Label>Category name</Label>
                        <Input value={category.name} onChange={(e) => updateBuiltInCategory(index, { name: e.target.value })} placeholder="Needs Discovery" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Weight %</Label>
                        <Input type="number" min="0" max="100" value={category.weight} onChange={(e) => updateBuiltInCategory(index, { weight: Number(e.target.value) })} />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeBuiltInCategory(index)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {SCORE_BANDS.map((band) => (
                        <div key={band} className="space-y-1.5">
                          <Label>{band}</Label>
                          <Textarea value={category.anchors?.[band] || ''} onChange={(e) => updateBuiltInAnchor(index, band, e.target.value)} rows={2}
                            placeholder={band === '10' ? 'Excellent execution with clear evidence.' : 'Describe what this score range means.'} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingBuiltIn(null)}>Cancel</Button>
            <Button type="button" variant="outline" disabled={isBuiltInSaving || builtInRubricWeightTotal !== 100 || !builtInObjectionsValid} onClick={() => saveBuiltIn('draft')}>Save draft</Button>
            <Button type="button" disabled={isBuiltInSaving || builtInRubricWeightTotal !== 100 || !builtInObjectionsValid} onClick={() => saveBuiltIn('published')} className="gap-2">
              {isBuiltInSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit modal */}
      <Dialog open={editingScenario !== null} onOpenChange={(open) => { if (!open) setEditingScenario(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScenario?.id ? 'Edit scenario' : 'Create scenario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Birthday Party Inquiry" aria-invalid={!!fieldErrors.title} required />
                {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="characterName">Character name *</Label>
                <Input id="characterName" value={form.characterName} onChange={(e) => setField('characterName', e.target.value)} placeholder="e.g. Jessica" aria-invalid={!!fieldErrors.characterName} required />
                {fieldErrors.characterName && <p className="text-xs text-destructive">{fieldErrors.characterName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} aria-invalid={!!fieldErrors.description} required />
              {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Topics (up to 6)</Label>
              <div className="flex gap-2">
                <Input value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTopic(); } }}
                  placeholder="e.g. Pricing, Schedule" maxLength={40} disabled={form.topics.length >= 6} />
                <Button type="button" variant="outline" onClick={addTopic} disabled={!topicInput.trim() || form.topics.length >= 6}>Add</Button>
              </div>
              {form.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.topics.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary border border-border">
                      {t}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, topics: f.topics.filter((x) => x !== t) }))} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contextType">Context type</Label>
                <Select value={form.contextType} onValueChange={(val) => setForm((f) => ({ ...f, contextType: val }))}>
                  <SelectTrigger id="contextType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTEXT_TYPES.map((ct) => <SelectItem key={ct.id} value={ct.id}>{ct.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voiceId">Voice</Label>
                <Select value={form.voiceId} onValueChange={(val) => setField('voiceId', val)}>
                  <SelectTrigger id="voiceId"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isGlobalAdmin ? (
              <div className="space-y-1.5">
                <Label>Visible to</Label>
                <Select value={form.schoolId == null ? 'all' : String(form.schoolId)}
                  onValueChange={(val) => setForm((f) => ({ ...f, schoolId: val === 'all' ? null : parseInt(val, 10) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All schools (platform-wide)</SelectItem>
                    {(schools ?? []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                <p className="font-medium">Visible to your school</p>
                <p className="mt-1 text-muted-foreground">
                  {profile?.school?.name || 'Your school'} only. Global scenarios are managed by platform admins.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="openingLine">Opening line *</Label>
              <Input id="openingLine" value={form.openingLine} onChange={(e) => setField('openingLine', e.target.value)}
                placeholder="What the AI character says first" aria-invalid={!!fieldErrors.openingLine} required />
              {fieldErrors.openingLine && <p className="text-xs text-destructive">{fieldErrors.openingLine}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="characterPrompt">Character prompt *</Label>
              <Textarea id="characterPrompt" value={form.characterPrompt}
                onChange={(e) => setField('characterPrompt', e.target.value)}
                rows={10} className="font-mono text-xs" aria-invalid={!!fieldErrors.characterPrompt} required />
              {fieldErrors.characterPrompt && <p className="text-xs text-destructive">{fieldErrors.characterPrompt}</p>}
            </div>

            <div className="border-t pt-4">
              <button type="button" onClick={() => setShowScoringPrompt(!showScoringPrompt)} className="text-sm text-primary hover:underline">
                {showScoringPrompt ? 'Hide' : 'Show'} custom scoring rubric (advanced)
              </button>
              {showScoringPrompt && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="scoringPrompt">Custom scoring prompt</Label>
                  <Textarea id="scoringPrompt" value={form.scoringPrompt}
                    onChange={(e) => setForm((f) => ({ ...f, scoringPrompt: e.target.value }))}
                    rows={6} className="font-mono text-xs" placeholder="Leave blank to use the default scoring rubric." />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingScenario(null)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingScenario?.id ? 'Save changes' : 'Create scenario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Custom scenario field guide</DialogTitle>
            <DialogDescription>
              Use this as a reference when creating a school-specific or platform-wide roleplay scenario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="font-medium text-foreground">Best scenario formula</p>
              <p className="mt-1 text-muted-foreground">
                A strong scenario has a clear situation, a believable caller, realistic objections, and simple rules for how the caller should react.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Title', 'The user-facing scenario name.', 'Birthday Party Inquiry'],
                ['Description', 'Short summary that tells staff what they are practicing.', 'Practice handling a parent asking about booking a martial arts birthday party.'],
                ['Visible to', 'Global admins choose all schools or one school. School admins automatically create for their school.', 'Testing School only'],
                ['Character name', 'The name of the AI roleplay character.', 'Jessica'],
                ['Context type', 'Choose whether the situation is inbound, outbound, or in-person.', 'Inbound Call'],
                ['Topics', 'Short tags for the skills or objections in the call.', 'Pricing, Schedule, Objections'],
                ['Voice', 'Pick a voice that fits the age, tone, and personality of the caller.', 'Emma for a warm parent caller'],
                ['Opening line', 'The first sentence the AI says after handoff.', 'Hi, I am calling about birthday parties. Do you still offer those?'],
                ['Custom scoring rubric', 'Optional advanced grading instructions when the default scorecard is not specific enough.', 'Score whether staff asked for the event date, built value, handled price, and asked for the booking.'],
              ].map(([title, description, example]) => (
                <div key={title} className="rounded-xl border border-border bg-secondary/20 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="mt-1 text-muted-foreground">{description}</p>
                      <p className="mt-2 rounded-lg bg-background/70 px-2 py-1.5 text-xs text-muted-foreground">
                        Example: {example}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="font-medium text-foreground">Character prompt checklist</p>
              <div className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                {[
                  'Who they are',
                  'Why they are calling',
                  'What they want',
                  'What concerns they have',
                  'How they react to strong answers',
                  'How difficulty changes behavior',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <p className="font-medium text-foreground">Prompt starter</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">{`## Who You Are
Your name is Jessica. You are the parent of an 8-year-old child.

## Situation
You are interested in booking a birthday party at the martial arts school.

## Concerns
- You want to know the price.
- You need a weekend time slot.
- You are worried some kids may be shy.

## Difficulty
Easy: You are excited and mostly ready to book.
Medium: You compare this to other party options.
Hard: You are skeptical about price and need strong reassurance.`}</pre>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <p className="font-medium text-foreground">Scoring rubric starter</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use this only when the scenario needs special grading beyond the default scorecard.
              </p>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">{`Score the call based on:
- Asked why the caller is interested
- Explained the offer clearly
- Built value before discussing price
- Handled the main objection confidently
- Asked for the next step or booking`}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete scenario</DialogTitle>
            <DialogDescription>This permanently deletes <strong>{deleteTarget?.title}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Type <span className="font-mono font-semibold text-foreground">delete scenario</span> to confirm:</p>
            <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete scenario" autoFocus />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteTarget?.id, { onSuccess: () => { setDeleteTarget(null); toast.success('Deleted'); }, onError: (err) => toast.error(err.message) })}
              disabled={deleteConfirmText !== 'delete scenario' || deleteMutation.isPending} className="gap-2">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

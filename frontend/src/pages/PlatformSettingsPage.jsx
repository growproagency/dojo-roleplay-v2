import { useState, useEffect } from 'react';
import { usePlatformSettings, useUpdatePlatformSettings } from '../hooks/useAdmin';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { ShieldAlert, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini · cheap, default scoring quality' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini · ~2.5× cost, slightly smarter' },
  { value: 'gpt-4o', label: 'gpt-4o · ~27× cost, strongest reasoning' },
  { value: 'gpt-4.1', label: 'gpt-4.1 · cheaper than 4o, similar quality' },
];

const SERVER_DEFAULT = '__server_default__';

export function PlatformSettingsPage() {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const [markup, setMarkup] = useState('0');
  const [model, setModel] = useState(SERVER_DEFAULT);
  const [defaultCap, setDefaultCap] = useState('');
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceSeverity, setMaintenanceSeverity] = useState('info');

  useEffect(() => {
    if (!settings) return;
    setMarkup(String(settings.markupPercent ?? 0));
    setModel(settings.defaultLlmModel ?? SERVER_DEFAULT);
    setDefaultCap(settings.defaultUsageCapUsd != null ? String(settings.defaultUsageCapUsd) : '');
    setMaintenanceEnabled(Boolean(settings.maintenanceEnabled));
    setMaintenanceMessage(settings.maintenanceMessage ?? '');
    setMaintenanceSeverity(settings.maintenanceSeverity ?? 'info');
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    const markupN = parseFloat(markup);
    if (!Number.isFinite(markupN) || markupN < 0 || markupN > 500) {
      toast.error('Markup must be between 0 and 500.');
      return;
    }
    let capValue = null;
    const trimmedCap = defaultCap.trim();
    if (trimmedCap !== '') {
      const capN = parseFloat(trimmedCap);
      if (!Number.isFinite(capN) || capN < 0) {
        toast.error('Default cap must be a positive number or empty.');
        return;
      }
      capValue = capN;
    }
    if (maintenanceEnabled && !maintenanceMessage.trim()) {
      toast.error('Add a maintenance message before enabling the banner.');
      return;
    }
    updateSettings.mutate({
      markupPercent: markupN,
      defaultLlmModel: model === SERVER_DEFAULT ? null : model,
      defaultUsageCapUsd: capValue,
      maintenanceEnabled,
      maintenanceMessage: maintenanceMessage.trim() || null,
      maintenanceSeverity,
    }, {
      onSuccess: () => toast.success('Platform settings saved'),
      onError: (err) => toast.error(err.message || 'Failed to save'),
    });
  };

  const exampleRaw = 0.20;
  const exampleMarkup = parseFloat(markup);
  const exampleBilled = Number.isFinite(exampleMarkup) && exampleMarkup >= 0
    ? exampleRaw * (1 + exampleMarkup / 100) : null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-2">
        <p className="text-muted-foreground text-sm">Global config that applies across every school.</p>

        <form onSubmit={handleSave} className="space-y-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription className="text-xs">Pricing markup, default scoring model, and the cap automatically applied to newly-created schools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="markup">Pricing markup (%)</Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input id="markup" type="number" min={0} max={500} step={0.01} value={markup}
                    onChange={(e) => setMarkup(e.target.value)} placeholder="0" disabled={isLoading} />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                {exampleBilled != null && (
                  <div className="text-xs text-muted-foreground border border-border/40 rounded-lg px-3 py-2 bg-muted/20 mt-2">
                    <strong className="text-foreground">Example:</strong> a call costing us{' '}
                    <span className="text-foreground">${exampleRaw.toFixed(2)}</span> will be billed at{' '}
                    <span className="text-foreground">${exampleBilled.toFixed(2)}</span> ({exampleMarkup.toFixed(2)}% markup).
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model">Scoring model</Label>
                <Select value={model} onValueChange={setModel} disabled={isLoading}>
                  <SelectTrigger id="model" className="w-full max-w-md">
                    <SelectValue placeholder="Use server default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SERVER_DEFAULT}>Use server default (LLM_MODEL env var)</SelectItem>
                    {MODEL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="defaultCap">Default usage cap for new schools (USD)</Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input id="defaultCap" type="number" min={0} step={0.01} value={defaultCap}
                    onChange={(e) => setDefaultCap(e.target.value)} placeholder="No default" disabled={isLoading} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />Maintenance notice
              </CardTitle>
              <CardDescription className="text-xs">Show a banner to all logged-in users. Useful for announcing maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceEnabled" className="text-sm">Show banner</Label>
                  <p className="text-xs text-muted-foreground">When on, every authenticated page shows the message below.</p>
                </div>
                <Switch id="maintenanceEnabled" checked={maintenanceEnabled} onCheckedChange={setMaintenanceEnabled} disabled={isLoading} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenanceSeverity">Severity</Label>
                <Select value={maintenanceSeverity} onValueChange={setMaintenanceSeverity} disabled={isLoading}>
                  <SelectTrigger id="maintenanceSeverity" className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info — blue</SelectItem>
                    <SelectItem value="warning">Warning — amber</SelectItem>
                    <SelectItem value="critical">Critical — red</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenanceMessage">Message</Label>
                <Textarea id="maintenanceMessage" value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Scheduled maintenance Friday at 2am UTC, ~30 minutes."
                  maxLength={500} rows={3} disabled={isLoading} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                Changing the markup affects existing schools' usage caps. Review schools after saving and adjust caps if needed.
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending || isLoading}>
              {updateSettings.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

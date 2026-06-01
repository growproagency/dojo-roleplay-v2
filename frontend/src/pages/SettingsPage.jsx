import { useState, useEffect } from 'react';
import { useSchool, useUpdateSchool } from '../hooks/useSchool';
import { useAdminSchools } from '../hooks/useAdmin';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/ui.store';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Save, School, MapPin, Tag, DollarSign, StickyNote, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_FORM = {
  schoolName: '', streetAddress: '', city: '', state: '', zipCode: '',
  introOffer: '', priceRangeLow: '', priceRangeHigh: '', programDirectorName: '', additionalNotes: '',
};

export function SettingsPage() {
  const { isGlobalAdmin } = useAuth();
  const viewingSchoolId = useUIStore((s) => s.viewingSchoolId);
  const setViewingSchoolId = useUIStore((s) => s.setViewingSchoolId);
  const { data: schools } = useAdminSchools(isGlobalAdmin);

  const { data: school, isLoading } = useSchool();
  const updateSchool = useUpdateSchool();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        schoolName: school.name ?? '',
        streetAddress: school.streetAddress ?? '',
        city: school.city ?? '',
        state: school.state ?? '',
        zipCode: school.zipCode ?? '',
        introOffer: school.introOffer ?? '',
        priceRangeLow: school.priceRangeLow != null ? String(school.priceRangeLow) : '',
        priceRangeHigh: school.priceRangeHigh != null ? String(school.priceRangeHigh) : '',
        programDirectorName: school.programDirectorName ?? '',
        additionalNotes: school.additionalNotes ?? '',
      });
    }
  }, [school]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!form.schoolName.trim()) {
      toast.error('School name is required.');
      return;
    }
    updateSchool.mutate({
      name: form.schoolName.trim(),
      streetAddress: form.streetAddress.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      zipCode: form.zipCode.trim() || undefined,
      introOffer: form.introOffer.trim() || undefined,
      priceRangeLow: form.priceRangeLow ? parseInt(form.priceRangeLow, 10) : undefined,
      priceRangeHigh: form.priceRangeHigh ? parseInt(form.priceRangeHigh, 10) : undefined,
      programDirectorName: form.programDirectorName.trim() || undefined,
      additionalNotes: form.additionalNotes.trim() || undefined,
    }, {
      onSuccess: () => { setSaved(true); toast.success('Settings saved!'); setTimeout(() => setSaved(false), 3000); },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 py-2">
        <p className="text-sm text-muted-foreground">
          These details are injected into the AI prospect's context so every roleplay call feels specific to your school.
        </p>

        {isGlobalAdmin && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Label className="shrink-0 text-sm">Viewing school:</Label>
                <Select
                  value={viewingSchoolId ? String(viewingSchoolId) : ''}
                  onValueChange={(val) => setViewingSchoolId(val ? parseInt(val, 10) : null)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a school…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(schools ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {isGlobalAdmin && !viewingSchoolId ? (
          <p className="text-sm text-muted-foreground text-center py-10">Select a school above to view its settings.</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <School className="w-4 h-4 text-primary" />School Identity
                </CardTitle>
                <CardDescription>The AI will greet callers on behalf of your school.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name <span className="text-red-400">*</span></Label>
                  <Input id="schoolName" placeholder="e.g. Gracie PAC MMA" value={form.schoolName}
                    onChange={(e) => handleChange('schoolName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="programDirectorName">Program Director Name</Label>
                  <Input id="programDirectorName" placeholder="e.g. Coach Mike" value={form.programDirectorName}
                    onChange={(e) => handleChange('programDirectorName', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input id="streetAddress" placeholder="e.g. 1234 Main Street" value={form.streetAddress}
                    onChange={(e) => handleChange('streetAddress', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="e.g. Tampa" value={form.city}
                      onChange={(e) => handleChange('city', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="e.g. FL" value={form.state}
                      onChange={(e) => handleChange('state', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input id="zipCode" placeholder="e.g. 33601" value={form.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />Introductory Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="introOffer">Offer Description</Label>
                  <Textarea id="introOffer" placeholder="e.g. 2-week free trial including a free uniform" value={form.introOffer}
                    onChange={(e) => handleChange('introOffer', e.target.value)} className="resize-none" rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Pricing Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceRangeLow">Monthly Low ($)</Label>
                    <Input id="priceRangeLow" type="number" min={0} placeholder="e.g. 99" value={form.priceRangeLow}
                      onChange={(e) => handleChange('priceRangeLow', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceRangeHigh">Monthly High ($)</Label>
                    <Input id="priceRangeHigh" type="number" min={0} placeholder="e.g. 199" value={form.priceRangeHigh}
                      onChange={(e) => handleChange('priceRangeHigh', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><StickyNote className="w-4 h-4 text-primary" />Additional Context</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea id="additionalNotes" placeholder="e.g. We offer BJJ, Muay Thai, and Kids Karate." value={form.additionalNotes}
                  onChange={(e) => handleChange('additionalNotes', e.target.value)} className="resize-none" rows={4} />
              </CardContent>
            </Card>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Changes take effect on your next call.</p>
              <Button onClick={handleSave} disabled={updateSchool.isPending} className="min-w-[120px]">
                {updateSchool.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : saved ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Saved!</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save Settings</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

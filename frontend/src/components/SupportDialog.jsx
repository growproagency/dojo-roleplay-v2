import { useState } from 'react';
import { CheckCircle2, Headphones, Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useCreateSupportRequest, useSupportRequests } from '../hooks/useSupportRequests';

const initialForm = { category: 'practice_call', subject: '', message: '' };

function getSubmissionError(error) {
  const detail = error?.details?.[0];
  if (detail?.field === 'subject') return 'Subject must be at least 3 characters.';
  if (detail?.field === 'message') return 'Details must be at least 10 characters.';
  if (detail?.message) return detail.message;
  if (error?.status === 404) return 'Support is not available on the server yet. Please try again after the backend is updated.';
  return error?.message || 'We could not send your request. Please try again.';
}

export function SupportDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(initialForm);
  const [reference, setReference] = useState('');
  const requestsQuery = useSupportRequests();
  const createRequest = useCreateSupportRequest();

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setReference('');
  };

  const submit = (event) => {
    event.preventDefault();
    createRequest.mutate({ ...form, pageUrl: `${window.location.pathname}${window.location.search}` }, {
      onSuccess: ({ data }) => {
        setReference(String(data.id));
        setForm(initialForm);
      },
    });
  };

  const requests = requestsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="pr-10">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Headphones className="h-5 w-5" /></div>
          <DialogTitle>Help & support</DialogTitle>
          <DialogDescription>Tell us what happened and our team will follow up with you.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label>What do you need help with?</Label>
              <Select value={form.category} onValueChange={(value) => update('category', value)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice_call">Practice call</SelectItem>
                  <SelectItem value="scoring">Scoring or call history</SelectItem>
                  <SelectItem value="account">Account access</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature">Feature request</SelectItem>
                  <SelectItem value="other">Something else</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="support-subject">Subject</Label><Input id="support-subject" maxLength={120} minLength={3} onChange={(e) => update('subject', e.target.value)} placeholder="A short description (at least 3 characters)" required value={form.subject} /></div>
            <div className="space-y-2"><Label htmlFor="support-message">Details</Label><Textarea id="support-message" className="min-h-32" maxLength={4000} minLength={10} onChange={(e) => update('message', e.target.value)} placeholder="What were you doing? What went wrong?" required value={form.message} /></div>
            <Button className="w-full gap-2" disabled={createRequest.isPending} type="submit">{createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{createRequest.isPending ? 'Sending request' : 'Send to support'}</Button>
            {createRequest.isError && <p className="text-sm text-destructive" role="alert">{getSubmissionError(createRequest.error)}</p>}
            {reference && <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" />Request received. Reference #{reference}</div>}
          </form>
          <aside className="border-t pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <h3 className="mb-3 text-sm font-semibold">Recent requests</h3>
            {requestsQuery.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>}
            {requestsQuery.isError && <p className="text-sm text-muted-foreground">Could not load requests.</p>}
            {!requestsQuery.isLoading && !requestsQuery.isError && requests.length === 0 && <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No requests yet.</p>}
            <div className="space-y-3">
              {requests.slice(0, 3).map((request) => <article className="rounded-xl border p-3" key={request.id}><div className="flex items-start justify-between gap-2"><strong className="text-sm">{request.subject}</strong><Badge variant={request.status === 'resolved' ? 'secondary' : 'outline'} className="capitalize">{request.status.replaceAll('_', ' ')}</Badge></div><p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{request.message}</p><small className="mt-2 block text-xs text-muted-foreground">#{request.id} · {new Date(request.created_at).toLocaleDateString()}</small></article>)}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

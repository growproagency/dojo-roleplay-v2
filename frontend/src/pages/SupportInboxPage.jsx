import { useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import { useAdminSupportRequests, useUpdateSupportRequest } from '../hooks/useAdmin';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const ALL = 'all';

function formatDate(value) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function SupportInboxPage() {
  const [filter, setFilter] = useState('open');
  const { data: requests = [], isLoading, isError } = useAdminSupportRequests(filter === ALL ? '' : filter);
  const updateRequest = useUpdateSupportRequest();

  const changeStatus = (id, status) => {
    updateRequest.mutate({ id, status }, {
      onSuccess: () => toast.success('Support request updated'),
      onError: (error) => toast.error(error.message || 'Could not update request'),
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 py-2">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Support Inbox</h1>
          <p className="text-muted-foreground">Review requests submitted by schools and keep their status current.</p>
        </div>
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Headphones className="h-4 w-4 text-primary" />Requests</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All statuses</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
            {isError && <p className="py-10 text-center text-sm text-destructive">Could not load support requests.</p>}
            {!isLoading && !isError && requests.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No requests match this filter.</p>}
            <div className="space-y-4">
              {requests.map((request) => (
                <article className="rounded-2xl border p-4" key={request.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{request.subject}</h2><Badge variant="outline" className="capitalize">{request.category.replaceAll('_', ' ')}</Badge></div><p className="mt-1 text-xs text-muted-foreground">#{request.id} · {request.email} · {request.schools?.name || 'Platform'} · {formatDate(request.created_at)}</p></div>
                    <Select disabled={updateRequest.isPending} value={request.status} onValueChange={(status) => changeStatus(request.id, status)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm">{request.message}</p>
                  {request.page_url && <p className="mt-3 truncate text-xs text-muted-foreground">Submitted from: {request.page_url}</p>}
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import { useAdminSchools, useResolveSystemEvent, useSystemEvents } from '../hooks/useAdmin';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertTriangle, CheckCircle2, Eye, Loader2, RotateCcw } from 'lucide-react';

const ALL = 'all';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function severityVariant(severity) {
  if (severity === 'critical' || severity === 'error') return 'destructive';
  if (severity === 'warning') return 'secondary';
  return 'outline';
}

function sourceLabel(value) {
  return String(value || 'unknown').replace(/_/g, ' ');
}

export function SystemEventsPage() {
  const [status, setStatus] = useState('open');
  const [source, setSource] = useState(ALL);
  const [severity, setSeverity] = useState(ALL);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const filters = useMemo(() => ({
    status: status === ALL ? undefined : status,
    source: source === ALL ? undefined : source,
    severity: severity === ALL ? undefined : severity,
    limit: 100,
  }), [severity, source, status]);

  const { data: events = [], isLoading, refetch } = useSystemEvents(filters);
  const { data: schools = [] } = useAdminSchools(true, 'all');
  const resolveMutation = useResolveSystemEvent(filters);

  const schoolById = useMemo(() => new Map(schools.map((school) => [school.id, school])), [schools]);
  const sources = useMemo(() => [...new Set(events.map((event) => event.source).filter(Boolean))].sort(), [events]);
  const openCount = events.filter((event) => event.status === 'open').length;

  const resolveEvent = (event) => {
    resolveMutation.mutate(event.id, {
      onSuccess: () => {
        toast.success('System event resolved');
        setSelectedEvent(null);
      },
      onError: (err) => toast.error(err.message || 'Failed to resolve event'),
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 py-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-normal">System Events</h1>
            <p className="text-muted-foreground">Product-critical failures from scoring, Vapi, invites, automation, and usage limits.</p>
          </div>
          <Button variant="outline" className="gap-2 self-start" onClick={() => refetch()}>
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusCard label="Open" value={openCount} tone="destructive" />
          <StatusCard label="Visible Rows" value={events.length} tone="default" />
          <StatusCard label="Sources" value={sources.length} tone="secondary" />
        </section>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Event Feed
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Sources</SelectItem>
                  {sources.map((item) => <SelectItem key={item} value={item}>{sourceLabel(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : events.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No system events match these filters.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Related</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDate(event.createdAt)}</TableCell>
                      <TableCell><Badge variant={severityVariant(event.severity)}>{event.severity}</Badge></TableCell>
                      <TableCell className="capitalize">{sourceLabel(event.source)}</TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="font-medium">{event.message}</div>
                          <div className="truncate text-xs text-muted-foreground">{event.eventType}</div>
                        </div>
                      </TableCell>
                      <TableCell>{event.schoolId ? (schoolById.get(event.schoolId)?.name ?? `School #${event.schoolId}`) : '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {event.callId ? <Link className="text-primary underline-offset-4 hover:underline" to={`/calls/${event.callId}`}>Call #{event.callId}</Link> : null}
                          {event.externalId ? <span className="max-w-40 truncate text-muted-foreground">{event.externalId}</span> : null}
                          {!event.callId && !event.externalId ? '-' : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'open' ? 'outline' : 'secondary'}>{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => setSelectedEvent(event)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                          {event.status === 'open' && (
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => resolveEvent(event)} disabled={resolveMutation.isPending}>
                              <CheckCircle2 className="h-4 w-4" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.message}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.eventType} - {formatDate(selectedEvent?.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted p-4 text-xs">
            {JSON.stringify(selectedEvent, null, 2)}
          </pre>
          <DialogFooter>
            {selectedEvent?.status === 'open' && (
              <Button className="gap-2" onClick={() => resolveEvent(selectedEvent)} disabled={resolveMutation.isPending}>
                <CheckCircle2 className="h-4 w-4" />
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatusCard({ label, value, tone }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold">{value}</p>
        </div>
        <Badge variant={tone}>{label}</Badge>
      </CardContent>
    </Card>
  );
}

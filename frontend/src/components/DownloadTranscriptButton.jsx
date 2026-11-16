import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { downloadTranscript, transcriptText } from '../utils/downloadTranscript';

export default function DownloadTranscriptButton({ call, compact = false }) {
  const available = !!transcriptText(call);
  return (
    <Button
      type="button"
      variant={compact ? 'ghost' : 'outline'}
      size="sm"
      disabled={!available}
      onClick={() => downloadTranscript(call)}
      aria-label={`Download transcript for ${call.userName || 'call'} (${call.id})`}
      title={available ? 'Download transcript' : 'Transcript not available yet'}
      className={compact ? 'shrink-0 rounded-md text-xs text-muted-foreground hover:text-primary disabled:opacity-35' : 'shrink-0'}
    >
      <Download className="w-4 h-4" />
      <span className={compact ? 'hidden sm:inline' : 'ml-2'}>{compact ? 'Transcript' : 'Download Transcript'}</span>
    </Button>
  );
}

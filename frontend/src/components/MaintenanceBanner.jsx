import { useEffect, useState } from 'react';
import { AlertTriangle, Info, OctagonAlert, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSystemStatus } from '../hooks/useSystem';

const STYLES = {
  info: { Icon: Info, wrap: 'border-blue-500/30 bg-blue-500/5', icon: 'text-blue-500' },
  warning: { Icon: AlertTriangle, wrap: 'border-amber-500/30 bg-amber-500/5', icon: 'text-amber-500' },
  critical: { Icon: OctagonAlert, wrap: 'border-red-500/30 bg-red-500/5', icon: 'text-red-500' },
};

function keyFor(message) {
  if (!message || typeof window === 'undefined') return null;
  return `dojo:maintenance:${btoa(unescape(encodeURIComponent(message))).slice(0, 16)}`;
}

export function MaintenanceBanner() {
  const { user, isGlobalAdmin } = useAuth();
  const { data } = useSystemStatus({ enabled: !!user, refetchOnWindowFocus: true });
  const notice = data?.maintenance;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = keyFor(notice?.message);
    setDismissed(key ? sessionStorage.getItem(key) === '1' : false);
  }, [notice?.message]);

  if (!notice?.enabled || !notice?.message || dismissed) return null;

  const style = STYLES[notice.severity] ?? STYLES.info;
  const Icon = style.Icon;

  const dismiss = () => {
    const key = keyFor(notice.message);
    if (key) sessionStorage.setItem(key, '1');
    setDismissed(true);
  };

  return (
    <div className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${style.wrap}`} role="status">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="whitespace-pre-wrap text-foreground">{notice.message}</p>
        {isGlobalAdmin && (
          <span className="mt-1 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="mt-0.5 shrink-0 rounded text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss notice"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

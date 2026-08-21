import { useEffect, useState } from 'react';
import { Headphones, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const ANNOUNCEMENT_VERSION = 1;

export function SupportAnnouncement({ userId, onOpenSupport }) {
  const [open, setOpen] = useState(false);
  const storageKey = `dojo:support-announcement:${ANNOUNCEMENT_VERSION}:${userId}`;

  useEffect(() => {
    if (!userId || window.localStorage.getItem(storageKey)) return;
    setOpen(true);
  }, [storageKey, userId]);

  const dismiss = () => {
    window.localStorage.setItem(storageKey, 'seen');
    setOpen(false);
  };

  const openSupport = () => {
    dismiss();
    onOpenSupport();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <div className="-mx-6 -mt-6 mb-5 bg-linear-to-br from-primary/15 via-primary/5 to-background px-6 py-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Headphones className="h-6 w-6" />
          </div>
        </div>
        <DialogHeader>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            New feature
          </div>
          <DialogTitle>Support is now built in</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Need help or spotted an issue? Select <span className="font-medium text-foreground">Support</span> in the top bar to send our team a request without leaving Dojo Roleplay.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 sm:justify-between">
          <Button variant="ghost" onClick={dismiss}>Maybe later</Button>
          <Button className="gap-2" onClick={openSupport}>
            <Headphones className="h-4 w-4" />
            Try support
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

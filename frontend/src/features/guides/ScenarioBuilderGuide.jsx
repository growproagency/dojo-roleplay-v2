import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useSaveTutorialProgress, useTutorialProgress } from '../../hooks/useTutorial';
import {
  SCENARIO_BUILDER_GUIDE_KEY,
  SCENARIO_BUILDER_GUIDE_VERSION,
  scenarioBuilderGuideSteps,
  scenarioBuilderVideoShareUrl,
  scenarioBuilderVideoUrl,
} from './scenarioBuilderGuide.config';

export function ScenarioBuilderGuide({ enabled = true }) {
  const [open, setOpen] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const { data: progress, isSuccess } = useTutorialProgress(
    SCENARIO_BUILDER_GUIDE_KEY,
    SCENARIO_BUILDER_GUIDE_VERSION,
    { enabled },
  );
  const { mutate: saveProgress } = useSaveTutorialProgress(
    SCENARIO_BUILDER_GUIDE_KEY,
    SCENARIO_BUILDER_GUIDE_VERSION,
  );

  // First visit after the builder is enabled: show the walkthrough once, unprompted.
  useEffect(() => {
    if (!enabled || !isSuccess || autoOpened || progress) return;
    setAutoOpened(true);
    setOpen(true);
  }, [enabled, isSuccess, autoOpened, progress]);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next && progress?.status !== 'completed') saveProgress({ status: 'completed', currentStep: 0 });
  };

  if (!enabled) return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2 text-foreground">
        <PlayCircle className="h-4 w-4" />
        How to guide
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>How the Scenario Builder works</DialogTitle>
            <DialogDescription>
              Watch the walkthrough, then follow the same five steps to build your first AI roleplay.
            </DialogDescription>
          </DialogHeader>

          {scenarioBuilderVideoUrl ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black pb-[56.25%]">
              <iframe
                src={scenarioBuilderVideoUrl}
                title="Scenario Builder walkthrough"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
              The walkthrough video is not configured yet. Set <code className="font-mono">VITE_SCENARIO_BUILDER_LOOM_URL</code> to
              the Loom share link to show it here.
            </div>
          )}

          <div className="grid gap-3 text-sm md:grid-cols-2">
            {scenarioBuilderGuideSteps.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-secondary/20 p-3">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <DialogFooter showCloseButton>
            {scenarioBuilderVideoShareUrl && (
              <Button variant="ghost" asChild>
                <a href={scenarioBuilderVideoShareUrl} target="_blank" rel="noreferrer">Open video in a new tab</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ScenarioBuilderGuide;

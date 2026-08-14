export const SCENARIO_BUILDER_GUIDE_KEY = 'scenario-builder-guide';
export const SCENARIO_BUILDER_GUIDE_VERSION = 1;

const LOOM_URL_PATTERN = /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/;

// Accepts a Loom share link or an embed link and returns the video id.
// Returns '' when nothing usable is configured, so the guide can hide the player.
export function toLoomVideoId(url) {
  const match = LOOM_URL_PATTERN.exec(url || '');
  return match ? match[1] : '';
}

const loomVideoId = toLoomVideoId(import.meta.env.VITE_SCENARIO_BUILDER_LOOM_URL);

export const scenarioBuilderVideoUrl = loomVideoId ? `https://www.loom.com/embed/${loomVideoId}` : '';
export const scenarioBuilderVideoShareUrl = loomVideoId ? `https://www.loom.com/share/${loomVideoId}` : '';

export const scenarioBuilderGuideSteps = [
  {
    title: '1. Brief',
    body: 'Name the scenario, pick the call type, and describe what staff are practicing and what a good outcome looks like.',
  },
  {
    title: '2. Caller',
    body: 'Give the AI caller a name, decide whether they are calling in or being called, and write the first line they say.',
  },
  {
    title: '3. Practice',
    body: 'List the moves staff should make on the call. Each move becomes something the scorecard grades.',
  },
  {
    title: '4. Objections',
    body: 'Add realistic concerns the caller raises, then set how many show up on easy, medium, and hard difficulty.',
  },
  {
    title: '5. Launch',
    body: 'Pick a voice that fits the caller, review the summary, and create the scenario. It appears under Scenarios right away.',
  },
];

import { labelScenario } from './scenarioLabels';

export function transcriptText(call) {
  const turns = (call.transcriptTurns ?? []).filter(turn => turn.text?.trim());
  if (turns.length) {
    return turns.map(turn => `${turn.role === 'staff' ? 'Staff' : 'AI Prospect'}: ${turn.text}`).join('\n\n');
  }
  return call.transcription?.trim() ?? '';
}

export function downloadTranscript(call) {
  const transcript = transcriptText(call);
  if (!transcript) return;

  const content = [
    'Call Transcript',
    `Scenario: ${labelScenario(call.scenario)}`,
    `Call ID: ${call.id}`,
    `Date: ${call.createdAt}`,
    ...(call.userName ? [`Staff: ${call.userName}`] : []),
    ...(call.difficulty ? [`Difficulty: ${call.difficulty}`] : []),
    ...(call.durationSeconds != null ? [`Duration: ${call.durationSeconds} seconds`] : []),
    '',
    transcript,
    '',
  ].join('\n');
  const filename = `call-transcript-${call.id}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

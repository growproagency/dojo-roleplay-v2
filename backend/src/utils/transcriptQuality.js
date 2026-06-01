export function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

export function isScoreableTranscriptTurns(turns) {
  const staffTurns = (turns || []).filter((turn) => turn.role === 'staff' && countWords(turn.text) >= 2);
  const prospectTurns = (turns || []).filter((turn) => turn.role === 'prospect' && countWords(turn.text) >= 2);
  const staffWordCount = countWords(staffTurns.map((turn) => turn.text).join(' '));

  return staffTurns.length >= 1
    && prospectTurns.length >= 1
    && (turns || []).length >= 3
    && staffWordCount >= 8;
}

export function parseTranscriptTurns(transcription) {
  return String(transcription || '')
    .split('\n')
    .map((line) => {
      const [label, ...rest] = line.split(':');
      const text = rest.join(':').trim();
      if (!text) return null;
      if (label === 'Staff') return { role: 'staff', text };
      if (label === 'Prospect') return { role: 'prospect', text };
      return null;
    })
    .filter(Boolean);
}

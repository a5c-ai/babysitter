// Fixture: HYPOTHESES with all required fields including snake_case
// `falsifying_observation`. Lint should accept.
export const HYPOTHESES = [
  {
    id: 'H1',
    title: 'Audio context auto-suspends after cycle 1',
    prediction: 'cycle 2 wedges if AudioContext.state !== "running"',
    falsifying_observation:
      'cycle 2 wedges even when AudioContext.state === "running" at cycle-2 start',
    likelihood: 'medium',
  },
  {
    id: 'H2',
    title: 'Gesture token consumed by HTMLAudioElement.play()',
    prediction: 'SpeechRecognition silently wedges after audio.play()',
    falsifying_observation:
      'SpeechRecognition emits onresult after audio.play() in the same gesture',
    likelihood: 'high',
  },
];

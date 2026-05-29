// Fixture: HYPOTHESES with camelCase `falsifyingObservation`. Lint should
// accept either alias.
export const HYPOTHESES = [
  {
    id: 'H1',
    title: 'Migration drift between local and remote',
    prediction: 'remote schema rejects insert that local accepts',
    falsifyingObservation:
      'remote insert succeeds with the same payload local accepts',
    likelihood: 'low',
  },
];

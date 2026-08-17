// Deliberately not evaluable by bare Node: this mirrors react-native's own
// Flow-typed entrypoint, which is the reason a bundler-runtime package cannot
// answer a Node root import.
import typeof * as NotNodeEvaluable from './index.js.flow';
export const answer = 42;

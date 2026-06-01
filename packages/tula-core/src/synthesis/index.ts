export type {
  SynthesisStrategyKind,
  MergeSynthesisStrategy,
  VoteSynthesisStrategy,
  RankSynthesisStrategy,
  SynthesisStrategy,
  SynthesisInput,
  SynthesisOutput,
  ResultSynthesizer,
} from "./types";

export {
  ResultSynthesizerImpl,
  type ResultSynthesizerImplOptions,
} from "./synthesizer";

export {
  applyMergeSynthesis,
  applyVoteSynthesis,
  applyRankSynthesis,
  type RankSynthesisConfig,
} from "./strategies";

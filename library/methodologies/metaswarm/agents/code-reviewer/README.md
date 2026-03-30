# Code Reviewer Agent

Adversarial code reviewer adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Role

Performs fresh adversarial code reviews with binary PASS/FAIL verdicts and evidence citations.

## Used By

- `metaswarm-execution-loop` process (Phase 3: Adversarial Review)
- `metaswarm-orchestrator` process (adversarial review step)
- `adversarial-review` skill

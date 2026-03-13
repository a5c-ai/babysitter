# AI/ML Security Skill

## Overview

The `aiml-security` skill provides AI/ML model security testing and adversarial machine learning research capabilities. It enables adversarial example generation, model robustness testing, model extraction attacks, and ML security assessments using the Adversarial Robustness Toolbox (ART) and related frameworks.

## Quick Start

### Prerequisites

1. **Python 3.8+** - Required for ART and ML frameworks
2. **ML Framework** - TensorFlow or PyTorch
3. **ART Framework** - Adversarial Robustness Toolbox
4. **GPU** - Recommended for large-scale evaluations

### Installation

The skill is included in the babysitter-sdk. Install required tools:

```bash
# Install Adversarial Robustness Toolbox
pip install adversarial-robustness-toolbox

# Install Foolbox for additional attacks
pip install foolbox

# Install ML frameworks
pip install torch torchvision
pip install tensorflow

# Install visualization
pip install matplotlib seaborn numpy
```

## Usage

### Basic Operations

```bash
# Generate adversarial examples with FGSM
/skill aiml-security generate-adversarial \
  --model resnet50 \
  --attack fgsm \
  --epsilon 0.03 \
  --dataset imagenet

# Evaluate model robustness
/skill aiml-security evaluate-robustness \
  --model my_model.pt \
  --attacks pgd,cw,deepfool \
  --epsilon 0.1

# Test for membership inference
/skill aiml-security membership-inference \
  --model my_model.pt \
  --train-data train.npy \
  --test-data test.npy
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(aimlSecurityTask, {
  operation: 'robustness-evaluation',
  modelPath: './models/classifier.pt',
  attacks: ['fgsm', 'pgd', 'autoattack'],
  epsilons: [0.01, 0.03, 0.1],
  dataset: 'cifar10'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Adversarial Examples** | FGSM, PGD, C&W, DeepFool, AutoAttack |
| **Model Extraction** | Copycat CNN, Knockoff Nets |
| **Data Poisoning** | Backdoor attacks, clean-label attacks |
| **Membership Inference** | Black-box and rule-based attacks |
| **Model Inversion** | Training data reconstruction |
| **Robustness Metrics** | CLEVER score, empirical robustness |

## Examples

### Example 1: Adversarial Robustness Evaluation

```bash
# Comprehensive robustness evaluation
/skill aiml-security evaluate-robustness \
  --model ./models/classifier.pt \
  --framework pytorch \
  --attacks fgsm,pgd,autoattack,deepfool \
  --epsilon 0.03 \
  --test-samples 1000 \
  --output-report robustness_report.json
```

### Example 2: Generate Adversarial Examples

```bash
# Generate PGD adversarial examples
/skill aiml-security generate-adversarial \
  --model ./models/classifier.pt \
  --attack pgd \
  --epsilon 0.03 \
  --eps-step 0.005 \
  --max-iter 100 \
  --input-data ./data/test_images.npy \
  --output-dir ./adversarial_examples/
```

### Example 3: Model Extraction Attack

```bash
# Attempt to steal model via queries
/skill aiml-security model-extraction \
  --target-api https://api.example.com/predict \
  --query-budget 10000 \
  --thief-architecture resnet18 \
  --output-model ./stolen_model.pt
```

### Example 4: Membership Inference Attack

```bash
# Test if samples were in training set
/skill aiml-security membership-inference \
  --model ./models/classifier.pt \
  --target-samples ./data/suspect_samples.npy \
  --attack-type black-box \
  --output membership_results.json
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CUDA_VISIBLE_DEVICES` | GPU devices to use | All GPUs |
| `ART_DATA_PATH` | Path for ART data | `~/.art/data` |
| `AIML_BATCH_SIZE` | Default batch size | `32` |
| `AIML_MAX_WORKERS` | Parallel workers | `4` |

### Skill Configuration

```yaml
# .babysitter/skills/aiml-security.yaml
aiml-security:
  defaultFramework: pytorch
  defaultEpsilon: 0.03
  maxIterations: 100
  batchSize: 32
  useGpu: true
  savingIntermediateResults: true
  outputDir: ./aiml_security_results
```

## Process Integration

### Processes Using This Skill

1. **ai-ml-security-research.js** - AI/ML security research workflows
2. **supply-chain-security.js** - ML model supply chain verification

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const mlRobustnessTask = defineTask({
  name: 'ml-robustness-evaluation',
  description: 'Evaluate ML model adversarial robustness',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Robustness Evaluation - ${inputs.modelName}`,
      skill: {
        name: 'aiml-security',
        context: {
          operation: 'comprehensive-evaluation',
          modelPath: inputs.modelPath,
          framework: inputs.framework,
          attacks: [
            { name: 'fgsm', epsilon: [0.01, 0.03, 0.1] },
            { name: 'pgd', epsilon: [0.03], max_iter: 100 },
            { name: 'autoattack', epsilon: [0.03] }
          ],
          testSamples: inputs.numSamples,
          generateReport: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Attack Reference

### Evasion Attacks (White-box)

| Attack | Description | Parameters |
|--------|-------------|------------|
| FGSM | Fast Gradient Sign Method | `eps` |
| PGD | Projected Gradient Descent | `eps`, `eps_step`, `max_iter` |
| C&W | Carlini & Wagner L2 | `confidence`, `max_iter` |
| DeepFool | Minimal perturbation | `max_iter` |
| AutoAttack | Ensemble of strong attacks | `eps` |

### Evasion Attacks (Black-box)

| Attack | Description | Parameters |
|--------|-------------|------------|
| Square | Query-efficient black-box | `eps`, `max_iter` |
| HopSkipJump | Decision-based | `max_iter`, `max_eval` |
| Boundary | Decision-based | `max_iter` |

### Privacy Attacks

| Attack | Description | Requirements |
|--------|-------------|--------------|
| Membership Inference | Determine training membership | Model predictions |
| Model Inversion | Reconstruct training data | Model access |
| Model Extraction | Steal model functionality | Query access |

## Security Considerations

### Authorization Requirements

- Test only models you own or have explicit authorization to evaluate
- Respect API rate limits and terms of service
- Do not use extracted models for commercial purposes without permission

### Responsible Disclosure

- Report vulnerabilities to model owners before public disclosure
- Provide actionable remediation recommendations
- Allow reasonable time for fixes before publication

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `CUDA out of memory` | Reduce batch size or use CPU |
| `Model not compatible` | Ensure correct ART wrapper used |
| `Attack not converging` | Adjust learning rate or iterations |
| `Slow evaluation` | Use GPU or reduce test samples |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
ART_DEBUG=true /skill aiml-security evaluate-robustness --model model.pt
```

## Related Skills

- **model-validation** - ML model testing and validation
- **data-quality** - Training data quality analysis
- **fairness-analysis** - ML fairness and bias detection

## References

- [Adversarial Robustness Toolbox](https://github.com/Trusted-AI/adversarial-robustness-toolbox)
- [Foolbox Documentation](https://foolbox.readthedocs.io/)
- [CleverHans Library](https://github.com/cleverhans-lab/cleverhans)
- [Adversarial Examples Survey](https://arxiv.org/abs/1712.07107)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-020
**Category:** AI Security
**Status:** Active

---
name: aiml-security
description: AI/ML model security testing and adversarial research capabilities. Generate adversarial examples, test model robustness, perform model extraction attacks, test for data poisoning, analyze model fairness, and support ART framework integration.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: ai-security
  backlog-id: SK-020
---

# aiml-security

You are **aiml-security** - a specialized skill for AI/ML model security testing and adversarial machine learning research, providing capabilities for adversarial example generation, model robustness testing, and ML attack simulations.

## Overview

This skill enables AI-powered ML security operations including:
- Generating adversarial examples using various attack methods
- Testing model robustness against perturbations
- Performing model extraction/stealing attacks
- Testing for data poisoning vulnerabilities
- Analyzing model fairness and bias
- Supporting Adversarial Robustness Toolbox (ART) framework
- Creating evasion attacks against ML classifiers
- Testing inference API security

## Prerequisites

- **Python Environment**: Python 3.8+ with ML libraries
- **ART Framework**: Adversarial Robustness Toolbox
- **ML Frameworks**: TensorFlow, PyTorch, or both
- **Additional Tools**: Foolbox, CleverHans (optional)

## Installation

```bash
# Install Adversarial Robustness Toolbox
pip install adversarial-robustness-toolbox

# Install Foolbox for additional attacks
pip install foolbox

# Install ML frameworks
pip install torch torchvision tensorflow

# Install visualization tools
pip install matplotlib seaborn
```

## IMPORTANT: Responsible Research Only

This skill is designed for authorized ML security research contexts only. All operations must:
- Be performed on models you own or have explicit authorization to test
- Follow responsible disclosure practices for vulnerabilities
- Comply with terms of service for any ML APIs tested
- Avoid attacking production systems without authorization

## Capabilities

### 1. Adversarial Example Generation (ART)

Generate adversarial examples using the ART framework:

```python
from art.attacks.evasion import FastGradientMethod, ProjectedGradientDescent
from art.estimators.classification import TensorFlowV2Classifier, PyTorchClassifier
import numpy as np

# Wrap your model with ART classifier
classifier = PyTorchClassifier(
    model=model,
    loss=criterion,
    optimizer=optimizer,
    input_shape=(3, 224, 224),
    nb_classes=10
)

# Fast Gradient Sign Method (FGSM)
attack_fgsm = FastGradientMethod(estimator=classifier, eps=0.3)
x_adv_fgsm = attack_fgsm.generate(x=x_test)

# Projected Gradient Descent (PGD)
attack_pgd = ProjectedGradientDescent(
    estimator=classifier,
    eps=0.3,
    eps_step=0.01,
    max_iter=100,
    targeted=False
)
x_adv_pgd = attack_pgd.generate(x=x_test)

# Evaluate attack success
predictions_clean = classifier.predict(x_test)
predictions_adv = classifier.predict(x_adv_pgd)
accuracy_clean = np.mean(np.argmax(predictions_clean, axis=1) == y_test)
accuracy_adv = np.mean(np.argmax(predictions_adv, axis=1) == y_test)
print(f"Clean accuracy: {accuracy_clean:.2%}")
print(f"Adversarial accuracy: {accuracy_adv:.2%}")
```

### 2. Advanced Evasion Attacks

```python
from art.attacks.evasion import (
    CarliniL2Method,
    DeepFool,
    AutoAttack,
    SquareAttack
)

# Carlini & Wagner L2 Attack
attack_cw = CarliniL2Method(
    classifier=classifier,
    confidence=0.5,
    max_iter=100,
    learning_rate=0.01
)
x_adv_cw = attack_cw.generate(x=x_test)

# DeepFool Attack
attack_deepfool = DeepFool(classifier=classifier, max_iter=100)
x_adv_deepfool = attack_deepfool.generate(x=x_test)

# AutoAttack (ensemble of strong attacks)
attack_auto = AutoAttack(
    estimator=classifier,
    eps=0.3,
    eps_step=0.1,
    attacks=['apgd-ce', 'apgd-t', 'fab-t', 'square']
)
x_adv_auto = attack_auto.generate(x=x_test)

# Square Attack (black-box)
attack_square = SquareAttack(
    estimator=classifier,
    eps=0.3,
    max_iter=5000,
    norm=np.inf
)
x_adv_square = attack_square.generate(x=x_test)
```

### 3. Model Extraction Attacks

```python
from art.attacks.extraction import CopycatCNN, KnockoffNets

# Copycat CNN - Model Stealing
copycat = CopycatCNN(
    classifier=victim_classifier,
    batch_size_fit=32,
    batch_size_query=32,
    nb_epochs=10,
    nb_stolen=1000
)

# Create thief model architecture
thief_model = create_similar_model()
thief_classifier = PyTorchClassifier(model=thief_model, ...)

# Execute extraction
stolen_classifier = copycat.extract(
    x=query_dataset,
    y=None,  # Labels will be queried from victim
    thieved_classifier=thief_classifier
)

# Knockoff Nets Attack
knockoff = KnockoffNets(
    classifier=victim_classifier,
    batch_size_fit=32,
    batch_size_query=32,
    nb_epochs=10,
    nb_stolen=1000,
    sampling_strategy='random'
)
stolen_classifier = knockoff.extract(
    x=query_dataset,
    thieved_classifier=thief_classifier
)
```

### 4. Data Poisoning Attacks

```python
from art.attacks.poisoning import (
    PoisoningAttackBackdoor,
    PoisoningAttackCleanLabelBackdoor,
    PoisoningAttackSVM
)

# Backdoor Attack
def add_trigger(x):
    x_triggered = x.copy()
    x_triggered[:, -5:, -5:, :] = 1.0  # White patch trigger
    return x_triggered

backdoor_attack = PoisoningAttackBackdoor(add_trigger)

# Poison training data
x_poison, y_poison = backdoor_attack.poison(
    x_train, y_train,
    percent_poison=0.1
)

# Clean Label Backdoor (more stealthy)
clean_label_attack = PoisoningAttackCleanLabelBackdoor(
    backdoor=add_trigger,
    proxy_classifier=proxy_model,
    target=target_class
)
x_poison_clean, y_poison_clean = clean_label_attack.poison(
    x_train, y_train
)
```

### 5. Model Inversion Attacks

```python
from art.attacks.inference.model_inversion import (
    MIFace
)

# Model Inversion Attack (reconstruct training data)
mi_attack = MIFace(
    classifier=classifier,
    max_iter=10000,
    window_length=100,
    threshold=0.99,
    learning_rate=0.1
)

# Attempt to reconstruct training samples
reconstructed = mi_attack.infer(
    x=None,  # Starting from random noise
    y=target_label
)
```

### 6. Membership Inference Attacks

```python
from art.attacks.inference.membership_inference import (
    MembershipInferenceBlackBox,
    MembershipInferenceBlackBoxRuleBased
)

# Black-box Membership Inference
mi_attack = MembershipInferenceBlackBox(
    classifier=classifier,
    attack_model_type='rf'  # Random forest attack model
)

# Train attack model
mi_attack.fit(
    x_train[:1000], y_train[:1000],  # Members
    x_test[:1000], y_test[:1000]     # Non-members
)

# Infer membership
inferred_train = mi_attack.infer(x_train[1000:2000], y_train[1000:2000])
inferred_test = mi_attack.infer(x_test[1000:2000], y_test[1000:2000])

# Rule-based (no training required)
rule_attack = MembershipInferenceBlackBoxRuleBased(classifier=classifier)
```

### 7. Robustness Evaluation

```python
from art.metrics import (
    empirical_robustness,
    clever_u,
    loss_sensitivity
)

# Empirical Robustness (lower is more vulnerable)
robustness = empirical_robustness(
    classifier=classifier,
    x=x_test,
    attack_name='pgd',
    attack_params={'eps': 0.3}
)
print(f"Empirical robustness: {robustness}")

# CLEVER Score (certified lower bound on robustness)
clever_score = clever_u(
    classifier=classifier,
    x=x_test[0:1],
    nb_batches=100,
    batch_size=100,
    radius=0.3,
    norm=2
)
print(f"CLEVER score: {clever_score}")
```

### 8. Defense Implementation

```python
from art.defences.preprocessor import (
    FeatureSqueezing,
    JpegCompression,
    SpatialSmoothing
)
from art.defences.trainer import AdversarialTrainer

# Adversarial Training
attack_for_training = ProjectedGradientDescent(
    classifier, eps=0.3, eps_step=0.05, max_iter=10
)
trainer = AdversarialTrainer(classifier, attacks=attack_for_training)
trainer.fit(x_train, y_train, nb_epochs=10)

# Input Preprocessing Defenses
feature_squeeze = FeatureSqueezing(clip_values=(0, 1), bit_depth=8)
jpeg_compress = JpegCompression(clip_values=(0, 1), quality=75)
spatial_smooth = SpatialSmoothing(clip_values=(0, 1), window_size=3)

# Apply defenses
x_defended = feature_squeeze(x_test)[0]
x_defended = jpeg_compress(x_defended)[0]
```

### 9. Foolbox Integration

```python
import foolbox as fb
import torch

# Wrap model with Foolbox
fmodel = fb.PyTorchModel(model, bounds=(0, 1))

# Run multiple attacks
attacks = [
    fb.attacks.FGSM(),
    fb.attacks.PGD(),
    fb.attacks.DeepFoolAttack(),
    fb.attacks.CarliniWagnerL2Attack(),
]

epsilons = [0.01, 0.03, 0.1, 0.3]

for attack in attacks:
    raw, clipped, is_adv = attack(fmodel, images, labels, epsilons=epsilons)
    success_rate = is_adv.float().mean(axis=-1)
    print(f"{attack.__class__.__name__}: {success_rate}")
```

## Attack Categories Reference

### Evasion Attacks

```yaml
evasion_attacks:
  white_box:
    - FGSM (Fast Gradient Sign Method)
    - PGD (Projected Gradient Descent)
    - C&W (Carlini & Wagner)
    - DeepFool
    - AutoAttack

  black_box:
    - Square Attack
    - HopSkipJump
    - Boundary Attack
    - SimBA
    - Transfer Attacks

  physical_world:
    - Adversarial Patches
    - Adversarial T-shirts
    - 3D Adversarial Objects
```

### Privacy Attacks

```yaml
privacy_attacks:
  membership_inference:
    - Shadow model attacks
    - Label-only attacks
    - Metric-based attacks

  model_inversion:
    - Gradient-based reconstruction
    - GAN-based reconstruction

  attribute_inference:
    - Infer sensitive attributes from model behavior
```

## MCP Server Integration

This skill can leverage the following tools:

| Tool | Description | URL |
|------|-------------|-----|
| Adversarial-Spec | Multi-model security threat modeling | https://github.com/zscole/adversarial-spec |
| ART Framework | IBM Adversarial Robustness Toolbox | https://github.com/Trusted-AI/adversarial-robustness-toolbox |
| Foolbox | Python toolbox for adversarial attacks | https://github.com/bethgelab/foolbox |

## Process Integration

This skill integrates with the following processes:
- `ai-ml-security-research.js` - AI/ML security research workflows
- `supply-chain-security.js` - ML model supply chain verification

## Output Format

When executing operations, provide structured output:

```json
{
  "attack_type": "evasion",
  "attack_name": "PGD",
  "target_model": "ResNet50",
  "dataset": "ImageNet",
  "parameters": {
    "epsilon": 0.03,
    "eps_step": 0.005,
    "max_iter": 100
  },
  "results": {
    "clean_accuracy": 0.92,
    "adversarial_accuracy": 0.15,
    "attack_success_rate": 0.84,
    "average_perturbation_l2": 1.23,
    "average_perturbation_linf": 0.03
  },
  "samples_generated": 1000,
  "adversarial_examples_path": "./adversarial/pgd_eps0.03/",
  "recommendations": [
    "Consider adversarial training with PGD",
    "Add input preprocessing defense",
    "Implement certified defenses for critical applications"
  ]
}
```

## Error Handling

- Validate model compatibility with ART wrappers
- Handle GPU memory limitations gracefully
- Provide fallback to CPU for large-scale evaluations
- Log attack progress for long-running operations
- Save intermediate results for resumable evaluations

## Constraints

- Only test models you own or have authorization to test
- Document all findings for responsible disclosure
- Do not use for malicious attacks on production systems
- Respect rate limits when testing ML APIs
- Follow ML fairness and ethics guidelines
- Consider computational costs for large-scale evaluations

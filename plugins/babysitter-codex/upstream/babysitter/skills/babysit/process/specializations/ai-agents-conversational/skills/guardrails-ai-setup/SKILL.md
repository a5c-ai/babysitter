---
name: guardrails-ai-setup
description: Guardrails AI validation framework setup for LLM applications. Implement input/output validation, safety checks, and structured output enforcement.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch
---

# guardrails-ai-setup

Configure Guardrails AI validation framework to ensure LLM outputs meet quality, safety, and structural requirements. Implement validators for input sanitization, output format enforcement, and safety constraints.

## Overview

Guardrails AI provides:
- Input validation before LLM calls
- Output validation after LLM responses
- Structured output enforcement (JSON, XML, etc.)
- Pre-built validators from Guardrails Hub
- Custom validator creation
- Automatic retry and correction mechanisms

## Capabilities

### Input Validation
- Sanitize user inputs
- Detect prompt injection attempts
- Validate input formats and lengths
- Check for PII before processing

### Output Validation
- Enforce structured output schemas
- Validate content accuracy
- Check for harmful content
- Verify factual consistency

### Safety Constraints
- Content moderation
- Toxicity detection
- Bias checking
- Hallucination detection

### Integration Features
- LangChain integration
- Streaming support
- Automatic retries
- Correction strategies

## Usage

### Basic Setup

```python
from guardrails import Guard
from guardrails.hub import ValidJson, ToxicLanguage, DetectPII

# Create guard with validators
guard = Guard().use_many(
    ValidJson(),
    ToxicLanguage(on_fail="fix"),
    DetectPII(on_fail="fix")
)

# Use with LLM
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

result = guard(
    llm,
    prompt="Generate a product description for a laptop",
    max_tokens=500
)

print(result.validated_output)
```

### Schema-Based Validation

```python
from guardrails import Guard
from pydantic import BaseModel, Field
from typing import List

class ProductReview(BaseModel):
    """Schema for product review output."""
    rating: int = Field(ge=1, le=5, description="Rating from 1-5")
    summary: str = Field(max_length=200, description="Brief summary")
    pros: List[str] = Field(min_items=1, max_items=5)
    cons: List[str] = Field(min_items=1, max_items=5)
    recommendation: bool

# Create guard from schema
guard = Guard.from_pydantic(ProductReview)

result = guard(
    llm,
    prompt="""Analyze this product and provide a structured review:
    Product: Wireless Noise-Canceling Headphones
    Price: $299
    Features: 30hr battery, ANC, Bluetooth 5.3
    """,
)

# Result is a validated ProductReview instance
review = result.validated_output
print(f"Rating: {review.rating}")
print(f"Summary: {review.summary}")
```

### Using Guardrails Hub Validators

```python
from guardrails import Guard
from guardrails.hub import (
    CompetitorCheck,
    ProfanityFree,
    ReadingTime,
    RestrictToTopic,
    SensitiveTopic,
    ToxicLanguage,
    ValidJson,
    ValidLength
)

# Install validators from hub
# guardrails hub install hub://guardrails/toxic_language

# Compose multiple validators
guard = Guard().use_many(
    ValidJson(on_fail="reask"),
    ToxicLanguage(threshold=0.8, on_fail="fix"),
    ProfanityFree(on_fail="fix"),
    ValidLength(min=100, max=1000, on_fail="reask"),
    RestrictToTopic(
        valid_topics=["technology", "software"],
        on_fail="reask"
    )
)
```

### Custom Validators

```python
from guardrails import Validator, register_validator
from guardrails.validators import ValidationResult

@register_validator(name="custom/no-urls", data_type="string")
class NoURLs(Validator):
    """Validator that checks for URLs in text."""

    def validate(self, value: str, metadata: dict) -> ValidationResult:
        import re
        url_pattern = r'https?://\S+'

        if re.search(url_pattern, value):
            return ValidationResult(
                outcome="fail",
                error_message="Text contains URLs which are not allowed",
                fix_value=re.sub(url_pattern, "[URL REMOVED]", value)
            )

        return ValidationResult(outcome="pass")

# Use custom validator
guard = Guard().use(NoURLs(on_fail="fix"))
```

### Prompt Injection Defense

```python
from guardrails import Guard
from guardrails.hub import DetectPromptInjection

# Create input guard for prompt injection
input_guard = Guard().use(
    DetectPromptInjection(
        on_fail="exception",
        threshold=0.9
    )
)

def safe_chat(user_input: str) -> str:
    # Validate input first
    try:
        input_guard.validate(user_input)
    except Exception as e:
        return "I cannot process that request."

    # Process safe input
    return llm.invoke(user_input)
```

### Integration with NeMo Guardrails

```python
from guardrails import Guard
from nemoguardrails import LLMRails, RailsConfig

# Combine Guardrails AI with NeMo Guardrails
config = RailsConfig.from_path("./config")
rails = LLMRails(config)

# Use Guardrails AI for structured output
output_guard = Guard.from_pydantic(OutputSchema)

async def guarded_chat(user_input: str) -> dict:
    # NeMo handles dialogue safety
    response = await rails.generate_async(
        messages=[{"role": "user", "content": user_input}]
    )

    # Guardrails AI validates structure
    validated = output_guard.validate(response["content"])

    return validated.validated_output
```

## Task Definition

```javascript
const guardrailsAISetupTask = defineTask({
  name: 'guardrails-ai-setup',
  description: 'Configure Guardrails AI validation for LLM application',

  inputs: {
    outputSchema: { type: 'object', required: false },
    validators: { type: 'array', required: true },
    onFailStrategy: { type: 'string', default: 'reask' },  // 'reask', 'fix', 'exception', 'filter'
    maxRetries: { type: 'number', default: 3 },
    enableInputValidation: { type: 'boolean', default: true },
    enableOutputValidation: { type: 'boolean', default: true }
  },

  outputs: {
    guardConfigured: { type: 'boolean' },
    validatorsInstalled: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Configure Guardrails AI validation',
      skill: {
        name: 'guardrails-ai-setup',
        context: {
          outputSchema: inputs.outputSchema,
          validators: inputs.validators,
          onFailStrategy: inputs.onFailStrategy,
          maxRetries: inputs.maxRetries,
          enableInputValidation: inputs.enableInputValidation,
          enableOutputValidation: inputs.enableOutputValidation,
          instructions: [
            'Install Guardrails AI package and hub validators',
            'Define output schema if structured output needed',
            'Configure selected validators with failure strategies',
            'Set up input validation for prompt injection defense',
            'Configure output validation for content safety',
            'Implement retry logic with correction strategies',
            'Test validation pipeline with sample inputs/outputs',
            'Document validation rules and expected behaviors'
          ]
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

## Applicable Processes

- system-prompt-guardrails
- prompt-injection-defense
- content-moderation-safety
- chatbot-design-implementation

## External Dependencies

- guardrails-ai Python package
- Guardrails Hub account (for hub validators)
- LLM provider (OpenAI, Anthropic, etc.)
- Optional: NeMo Guardrails for dialogue safety

## References

- [Guardrails AI GitHub](https://github.com/guardrails-ai/guardrails)
- [Guardrails AI Documentation](https://www.guardrailsai.com)
- [Guardrails Hub](https://hub.guardrailsai.com)
- [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)
- [OpenAI Guardrails Python](https://openai.github.io/openai-guardrails-python)

## Related Skills

- SK-SAF-001 content-moderation-api
- SK-SAF-003 nemo-guardrails
- SK-SAF-004 prompt-injection-detector
- SK-SAF-005 pii-redaction

## Related Agents

- AG-SAF-001 safety-auditor
- AG-SAF-002 prompt-injection-defender
- AG-PE-001 system-prompt-engineer

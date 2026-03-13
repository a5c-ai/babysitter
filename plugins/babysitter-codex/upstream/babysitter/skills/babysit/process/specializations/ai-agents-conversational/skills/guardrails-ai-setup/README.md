# Guardrails AI Setup Skill

## Overview

The `guardrails-ai-setup` skill configures Guardrails AI as a validation layer for LLM applications. It ensures that LLM inputs and outputs meet quality, safety, and structural requirements through a composable validator framework.

## Key Features

- **Schema Enforcement**: Ensure structured output in JSON, XML, or custom formats
- **Safety Validation**: Block toxic, harmful, or inappropriate content
- **Input Sanitization**: Protect against prompt injection and malicious inputs
- **Automatic Correction**: Retry with fixes when validation fails
- **Composable Validators**: Mix and match from Guardrails Hub

## Why Guardrails AI?

| Challenge | Guardrails Solution |
|-----------|-------------------|
| Unstructured LLM output | Pydantic schema enforcement |
| Toxic content generation | Hub validators (ToxicLanguage, ProfanityFree) |
| Prompt injection attacks | DetectPromptInjection validator |
| PII exposure | DetectPII with auto-redaction |
| Unreliable responses | Automatic retry with corrections |

## Prerequisites

1. **Python 3.8+**: Required runtime
2. **LLM API Key**: OpenAI, Anthropic, or compatible provider
3. **Guardrails Hub Account**: For pre-built validators (optional)

## Installation

```bash
# Core package
pip install guardrails-ai

# Initialize hub access
guardrails configure

# Install specific validators
guardrails hub install hub://guardrails/toxic_language
guardrails hub install hub://guardrails/detect_pii
guardrails hub install hub://guardrails/valid_json
```

## Quick Start

### 1. Basic Guard Setup

```python
from guardrails import Guard
from guardrails.hub import ValidJson, ToxicLanguage

# Create a guard with validators
guard = Guard().use_many(
    ValidJson(on_fail="reask"),
    ToxicLanguage(on_fail="fix")
)
```

### 2. LLM Integration

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

# Guard the LLM call
result = guard(
    llm,
    prompt="Generate a JSON object describing a book",
    max_tokens=500
)

if result.validation_passed:
    print("Valid output:", result.validated_output)
else:
    print("Validation failed:", result.error)
```

### 3. Schema-Based Validation

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class BookInfo(BaseModel):
    """Structured book information."""
    title: str = Field(description="Book title")
    author: str = Field(description="Author name")
    year: int = Field(ge=1000, le=2030, description="Publication year")
    genres: List[str] = Field(min_items=1, max_items=5)
    rating: Optional[float] = Field(ge=0, le=5, default=None)

# Create guard from schema
guard = Guard.from_pydantic(BookInfo)

result = guard(
    llm,
    prompt="Tell me about '1984' by George Orwell in structured format"
)

book = result.validated_output
print(f"{book.title} by {book.author} ({book.year})")
```

## Common Validators

### Content Safety

```python
from guardrails.hub import (
    ToxicLanguage,
    ProfanityFree,
    SensitiveTopic,
    RestrictToTopic
)

safety_guard = Guard().use_many(
    ToxicLanguage(threshold=0.8, on_fail="fix"),
    ProfanityFree(on_fail="fix"),
    SensitiveTopic(
        sensitive_topics=["violence", "self-harm"],
        on_fail="exception"
    ),
    RestrictToTopic(
        valid_topics=["technology", "business"],
        invalid_topics=["politics", "religion"],
        on_fail="reask"
    )
)
```

### Data Quality

```python
from guardrails.hub import (
    ValidJson,
    ValidLength,
    ValidUrl,
    ValidRange,
    ReadingTime
)

quality_guard = Guard().use_many(
    ValidJson(on_fail="reask"),
    ValidLength(min=100, max=5000, on_fail="reask"),
    ReadingTime(
        reading_time=3,  # minutes
        on_fail="fix"
    )
)
```

### Security

```python
from guardrails.hub import (
    DetectPromptInjection,
    DetectPII,
    SecretsPresent
)

security_guard = Guard().use_many(
    DetectPromptInjection(on_fail="exception"),
    DetectPII(
        pii_entities=["EMAIL", "PHONE", "SSN"],
        on_fail="fix"  # Redacts PII
    ),
    SecretsPresent(on_fail="exception")
)
```

## Failure Strategies

| Strategy | Behavior |
|----------|----------|
| `reask` | Retry the LLM call with error context |
| `fix` | Apply automatic correction if possible |
| `exception` | Raise an exception immediately |
| `filter` | Remove failing content, continue |
| `noop` | Log and continue without action |

```python
# Configure retry behavior
guard = Guard().use(
    ValidJson(on_fail="reask")
).configure(
    num_reasks=3  # Maximum retry attempts
)
```

## Custom Validators

### Simple Function Validator

```python
from guardrails import Validator, register_validator
from guardrails.validators import ValidationResult

@register_validator(name="custom/word-count", data_type="string")
class WordCount(Validator):
    """Validate word count is within range."""

    def __init__(self, min_words: int = 0, max_words: int = 1000, **kwargs):
        super().__init__(**kwargs)
        self.min_words = min_words
        self.max_words = max_words

    def validate(self, value: str, metadata: dict) -> ValidationResult:
        word_count = len(value.split())

        if word_count < self.min_words:
            return ValidationResult(
                outcome="fail",
                error_message=f"Too few words: {word_count} < {self.min_words}"
            )

        if word_count > self.max_words:
            return ValidationResult(
                outcome="fail",
                error_message=f"Too many words: {word_count} > {self.max_words}",
                fix_value=" ".join(value.split()[:self.max_words])
            )

        return ValidationResult(outcome="pass")

# Use the custom validator
guard = Guard().use(WordCount(min_words=50, max_words=500, on_fail="fix"))
```

### LLM-Based Validator

```python
@register_validator(name="custom/factual-check", data_type="string")
class FactualCheck(Validator):
    """Use LLM to check factual accuracy."""

    def __init__(self, context: str = "", **kwargs):
        super().__init__(**kwargs)
        self.context = context

    def validate(self, value: str, metadata: dict) -> ValidationResult:
        from langchain_openai import ChatOpenAI

        checker_llm = ChatOpenAI(model="gpt-4o-mini")

        prompt = f"""Check if this statement is factually accurate given the context.

Context: {self.context}
Statement: {value}

Respond with only "ACCURATE" or "INACCURATE"."""

        response = checker_llm.invoke(prompt).content.strip()

        if response == "ACCURATE":
            return ValidationResult(outcome="pass")
        else:
            return ValidationResult(
                outcome="fail",
                error_message="Statement may contain factual errors"
            )
```

## Integration Patterns

### With LangChain Chains

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# Create chain
prompt = PromptTemplate(
    template="Write a {word_count} word summary of: {topic}",
    input_variables=["word_count", "topic"]
)
chain = LLMChain(llm=llm, prompt=prompt)

# Wrap with guard
guarded_result = guard(
    lambda: chain.run(word_count=100, topic="AI safety")
)
```

### With Streaming

```python
# Enable streaming validation
guard = Guard().use(ValidJson(on_fail="reask"))

for chunk in guard.stream(
    llm,
    prompt="Generate JSON data",
    stream=True
):
    print(chunk, end="", flush=True)
```

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| system-prompt-guardrails | Output safety validation |
| prompt-injection-defense | Input sanitization |
| content-moderation-safety | Content filtering |
| chatbot-design-implementation | Response validation |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| validators | array | required | List of validators to apply |
| onFailStrategy | string | "reask" | Default failure handling |
| maxRetries | number | 3 | Maximum retry attempts |
| outputSchema | object | null | Pydantic schema for output |
| enableInputValidation | boolean | true | Validate inputs |
| enableOutputValidation | boolean | true | Validate outputs |

## Best Practices

### Validator Ordering

1. Security validators first (prompt injection, secrets)
2. Format validators second (JSON, length)
3. Content validators last (toxic, topic)

### Performance

- Use lightweight validators for streaming
- Cache validator instances when possible
- Consider async validators for I/O-bound checks

### Error Handling

- Always handle validation exceptions
- Provide fallback responses
- Log validation failures for analysis

## Troubleshooting

### Validator Not Working

1. Verify validator is installed from hub
2. Check on_fail strategy is appropriate
3. Review validator configuration
4. Test validator in isolation

### Too Many Retries

1. Adjust validator thresholds
2. Improve prompt quality
3. Use "fix" instead of "reask"
4. Add fallback validators

### Schema Validation Failing

1. Verify Pydantic model matches expected output
2. Add Field descriptions for clarity
3. Use Optional for non-required fields
4. Review LLM output format

## Security Considerations

- Implement prompt injection detection for all user inputs
- Use PII detection for sensitive applications
- Audit validation failures for attack patterns
- Keep validators updated from hub

## References

- [Guardrails AI Documentation](https://www.guardrailsai.com/docs)
- [Guardrails Hub](https://hub.guardrailsai.com)
- [Guardrails GitHub](https://github.com/guardrails-ai/guardrails)
- [Pydantic Documentation](https://docs.pydantic.dev)

## Related Resources

- [NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) - Dialogue guardrails
- [OpenAI Guardrails](https://openai.github.io/openai-guardrails-python) - OpenAI-specific guards
- [LangChain Output Parsers](https://python.langchain.com/docs/modules/model_io/output_parsers/)

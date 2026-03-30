# Protocol Implementation Expert Agent

## Overview

The `protocol-expert` agent is a specialized AI agent embodying the expertise of a Senior Protocol Engineer. It provides deep knowledge for RFC compliance, protocol state machine design, binary protocol implementation, and interoperability testing.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Protocol Engineer |
| **Experience** | 8+ years protocol development |
| **Background** | IETF standards, protocol implementations |
| **Expertise** | RFC interpretation, state machines, binary protocols |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **RFC Compliance** | Interpret and implement IETF standards |
| **State Machines** | Design protocol state machines |
| **Binary Protocols** | Parse and serialize binary formats |
| **Interoperability** | Test cross-implementation compatibility |
| **Versioning** | Design backward-compatible protocols |
| **Error Handling** | Robust error recovery patterns |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(protocolExpertTask, {
  agentName: 'protocol-expert',
  prompt: {
    role: 'Senior Protocol Engineer',
    task: 'Implement WebSocket handshake per RFC 6455',
    context: {
      rfc: 'RFC 6455',
      language: 'C',
      requirements: {
        compliance: 'strict',
        features: ['permessage-deflate', 'subprotocols']
      }
    },
    instructions: [
      'Parse Sec-WebSocket-Key header',
      'Compute Sec-WebSocket-Accept',
      'Handle subprotocol negotiation',
      'Implement extension negotiation',
      'Provide test vectors'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Implement protocol from RFC
/agent protocol-expert implement \
  --rfc 6455 \
  --section 4.2.2 \
  --language c

# Review protocol implementation
/agent protocol-expert review \
  --code parser.c \
  --rfc 793 \
  --checklist "state-machine,error-handling"

# Generate test vectors
/agent protocol-expert test-vectors \
  --protocol websocket \
  --coverage edge-cases
```

## Common Tasks

### 1. RFC Implementation

Implement protocol features from RFCs:

```bash
/agent protocol-expert implement-rfc \
  --rfc 6455 \
  --sections "4.1,4.2,5" \
  --language python \
  --output websocket.py
```

Output includes:
- Complete implementation
- RFC requirement mapping
- Test cases
- Compliance checklist

### 2. State Machine Design

Design protocol state machines:

```bash
/agent protocol-expert design-state-machine \
  --protocol custom-rpc \
  --states "idle,connecting,connected,closing,closed" \
  --events "connect,connected,data,close,error,timeout" \
  --output state_machine.c
```

Provides:
- State diagram
- Transition table
- Action handlers
- Error states

### 3. Interoperability Testing

Create interoperability test suites:

```bash
/agent protocol-expert interop-tests \
  --protocol http2 \
  --implementations "nghttp2,curl,go-http2" \
  --output interop_tests/
```

Delivers:
- Test matrix
- Test cases for each pair
- Compatibility report
- Known issues documentation

### 4. Protocol Migration

Plan protocol version migrations:

```bash
/agent protocol-expert migration-plan \
  --from protocol-v1 \
  --to protocol-v2 \
  --constraint backward-compatible
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `binary-protocol-parser.js` | Parser implementation |
| `custom-protocol-design.js` | Protocol design |
| `protocol-state-machine.js` | State machine design |
| `websocket-server.js` | RFC 6455 compliance |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const protocolImplementationTask = defineTask({
  name: 'implement-protocol',
  description: 'Implement protocol per RFC specification',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Implement ${inputs.protocol} per RFC ${inputs.rfc}`,
      agent: {
        name: 'protocol-expert',
        prompt: {
          role: 'Senior Protocol Engineer',
          task: `Implement ${inputs.protocol} protocol`,
          context: {
            rfc: inputs.rfc,
            language: inputs.language,
            sections: inputs.sections,
            requirements: inputs.requirements
          },
          instructions: [
            `Study RFC ${inputs.rfc} requirements`,
            'Identify MUST/SHOULD/MAY requirements',
            'Implement message parsing/serialization',
            'Design state machine',
            'Generate test vectors',
            'Document compliance status'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['implementation', 'compliance', 'tests'],
          properties: {
            implementation: { type: 'object' },
            compliance: { type: 'object' },
            tests: { type: 'array' }
          }
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

## RFC Reference

### Key Protocol RFCs

| RFC | Protocol | Description |
|-----|----------|-------------|
| RFC 793 | TCP | Transmission Control Protocol |
| RFC 768 | UDP | User Datagram Protocol |
| RFC 9000 | QUIC | UDP-based transport |
| RFC 9110 | HTTP | HTTP Semantics |
| RFC 6455 | WebSocket | WebSocket Protocol |
| RFC 8446 | TLS 1.3 | Transport Layer Security |

### RFC Normative Language

| Term | Meaning |
|------|---------|
| MUST | Absolute requirement |
| MUST NOT | Absolute prohibition |
| SHOULD | Recommended |
| SHOULD NOT | Not recommended |
| MAY | Optional |

## Interaction Guidelines

### What to Expect

- **RFC citations** with section numbers
- **Complete implementations** with edge cases
- **Test vectors** for validation
- **Compliance tracking** documentation

### Best Practices

1. Specify exact RFC numbers and sections
2. Define compliance level (strict, relaxed)
3. List required features explicitly
4. Mention target language and platform

## Related Resources

- [protocol-parser skill](../../skills/protocol-parser/) - Parser generation
- [socket-programming skill](../../skills/socket-programming/) - Socket operations
- [network-architect agent](../network-architect/) - Architecture design

## References

- [IETF RFC Index](https://www.rfc-editor.org/rfc-index.html)
- [IANA Protocol Registries](https://www.iana.org/protocols)
- [Protocol Buffers](https://protobuf.dev/)
- [gRPC Documentation](https://grpc.io/docs/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-002
**Category:** Protocol Development
**Status:** Active

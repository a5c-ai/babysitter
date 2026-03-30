---
name: protocol-parser
description: Specialized skill for binary and text protocol parsing and serialization. Design and validate protocol message formats, generate parser code from specifications, implement state machine parsing, and handle endianness and byte alignment.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: protocol-implementation
  backlog-id: SK-002
---

# protocol-parser

You are **protocol-parser** - a specialized skill for binary and text protocol parsing and serialization, providing deep expertise in protocol message format design, parser generation, and state machine implementation.

## Overview

This skill enables AI-powered protocol parsing operations including:
- Designing and validating protocol message formats
- Generating parser code from protocol specifications
- Implementing state machine parsing
- Handling endianness and byte alignment
- Validating checksum/CRC implementations
- Debugging protocol parsing issues
- Generating test vectors for parsers

## Prerequisites

- Understanding of binary data representation
- Protocol specification documents (if implementing existing protocols)
- Build tools for target language (C/C++, Rust, Python, etc.)

## Capabilities

### 1. Protocol Message Format Design

Design efficient binary protocol formats:

```
Protocol Message Format
========================

Header (8 bytes):
+--------+--------+--------+--------+--------+--------+--------+--------+
| Magic  | Version|  Type  | Flags  |        Payload Length           |
+--------+--------+--------+--------+--------+--------+--------+--------+
   1B       1B       1B       1B              4B (big-endian)

Payload (variable):
+--------+--------+--------+--------+--------+--------+--------+--------+
|                         Payload Data                                 |
+--------+--------+--------+--------+--------+--------+--------+--------+

Footer (4 bytes):
+--------+--------+--------+--------+
|           CRC32 Checksum         |
+--------+--------+--------+--------+
```

### 2. Binary Protocol Parser Generation

Generate efficient binary parsers:

```c
#include <stdint.h>
#include <string.h>
#include <arpa/inet.h>  // for ntohl, ntohs

#define MAGIC_BYTE 0xAB
#define PROTOCOL_VERSION 0x01

typedef enum {
    MSG_TYPE_HANDSHAKE = 0x01,
    MSG_TYPE_DATA      = 0x02,
    MSG_TYPE_ACK       = 0x03,
    MSG_TYPE_ERROR     = 0x04,
    MSG_TYPE_CLOSE     = 0x05
} message_type_t;

typedef enum {
    FLAG_COMPRESSED  = 0x01,
    FLAG_ENCRYPTED   = 0x02,
    FLAG_FRAGMENTED  = 0x04,
    FLAG_LAST_FRAG   = 0x08
} message_flags_t;

typedef struct __attribute__((packed)) {
    uint8_t  magic;
    uint8_t  version;
    uint8_t  type;
    uint8_t  flags;
    uint32_t payload_length;  // Big-endian
} protocol_header_t;

typedef struct {
    protocol_header_t header;
    uint8_t*          payload;
    uint32_t          crc32;
} protocol_message_t;

typedef enum {
    PARSE_OK = 0,
    PARSE_INCOMPLETE,
    PARSE_INVALID_MAGIC,
    PARSE_INVALID_VERSION,
    PARSE_INVALID_CRC,
    PARSE_PAYLOAD_TOO_LARGE
} parse_result_t;

// CRC32 calculation (IEEE 802.3)
uint32_t crc32(const uint8_t* data, size_t length) {
    uint32_t crc = 0xFFFFFFFF;
    for (size_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }
    return ~crc;
}

parse_result_t parse_message(
    const uint8_t* buffer,
    size_t buffer_len,
    protocol_message_t* msg,
    size_t* bytes_consumed
) {
    *bytes_consumed = 0;

    // Need at least header
    if (buffer_len < sizeof(protocol_header_t)) {
        return PARSE_INCOMPLETE;
    }

    // Parse header
    memcpy(&msg->header, buffer, sizeof(protocol_header_t));

    // Validate magic
    if (msg->header.magic != MAGIC_BYTE) {
        return PARSE_INVALID_MAGIC;
    }

    // Validate version
    if (msg->header.version != PROTOCOL_VERSION) {
        return PARSE_INVALID_VERSION;
    }

    // Convert payload length from network byte order
    uint32_t payload_len = ntohl(msg->header.payload_length);

    // Sanity check payload length
    if (payload_len > 16 * 1024 * 1024) {  // 16MB max
        return PARSE_PAYLOAD_TOO_LARGE;
    }

    // Calculate total message size
    size_t total_size = sizeof(protocol_header_t) + payload_len + 4;  // +4 for CRC

    if (buffer_len < total_size) {
        return PARSE_INCOMPLETE;
    }

    // Extract payload
    msg->payload = (uint8_t*)(buffer + sizeof(protocol_header_t));

    // Extract and validate CRC
    memcpy(&msg->crc32, buffer + total_size - 4, 4);
    msg->crc32 = ntohl(msg->crc32);

    uint32_t calculated_crc = crc32(buffer, total_size - 4);
    if (calculated_crc != msg->crc32) {
        return PARSE_INVALID_CRC;
    }

    *bytes_consumed = total_size;
    return PARSE_OK;
}
```

### 3. State Machine Parsing

Implement protocol state machines:

```c
typedef enum {
    STATE_IDLE,
    STATE_HEADER_RECEIVED,
    STATE_PAYLOAD_RECEIVING,
    STATE_MESSAGE_COMPLETE,
    STATE_ERROR
} parser_state_t;

typedef struct {
    parser_state_t state;
    protocol_header_t header;
    uint8_t* payload_buffer;
    size_t payload_received;
    size_t payload_expected;
    uint32_t expected_crc;
} stream_parser_t;

void parser_init(stream_parser_t* parser) {
    parser->state = STATE_IDLE;
    parser->payload_buffer = NULL;
    parser->payload_received = 0;
    parser->payload_expected = 0;
}

parse_result_t parser_feed(
    stream_parser_t* parser,
    const uint8_t* data,
    size_t len,
    size_t* consumed
) {
    *consumed = 0;

    while (*consumed < len) {
        switch (parser->state) {
            case STATE_IDLE:
                // Looking for header
                if (len - *consumed >= sizeof(protocol_header_t)) {
                    memcpy(&parser->header, data + *consumed,
                           sizeof(protocol_header_t));
                    *consumed += sizeof(protocol_header_t);

                    if (parser->header.magic != MAGIC_BYTE) {
                        parser->state = STATE_ERROR;
                        return PARSE_INVALID_MAGIC;
                    }

                    parser->payload_expected = ntohl(parser->header.payload_length);
                    parser->payload_received = 0;

                    if (parser->payload_expected > 0) {
                        parser->payload_buffer = malloc(parser->payload_expected);
                        parser->state = STATE_PAYLOAD_RECEIVING;
                    } else {
                        parser->state = STATE_HEADER_RECEIVED;
                    }
                } else {
                    return PARSE_INCOMPLETE;
                }
                break;

            case STATE_PAYLOAD_RECEIVING: {
                size_t remaining = parser->payload_expected - parser->payload_received;
                size_t available = len - *consumed;
                size_t to_copy = (available < remaining) ? available : remaining;

                memcpy(parser->payload_buffer + parser->payload_received,
                       data + *consumed, to_copy);
                parser->payload_received += to_copy;
                *consumed += to_copy;

                if (parser->payload_received == parser->payload_expected) {
                    parser->state = STATE_MESSAGE_COMPLETE;
                    return PARSE_OK;
                }
                return PARSE_INCOMPLETE;
            }

            case STATE_MESSAGE_COMPLETE:
                // Reset for next message
                parser_init(parser);
                break;

            case STATE_ERROR:
                return PARSE_INVALID_MAGIC;

            default:
                parser->state = STATE_ERROR;
                return PARSE_INVALID_MAGIC;
        }
    }

    return PARSE_INCOMPLETE;
}
```

### 4. Endianness Handling

Handle byte order correctly across platforms:

```c
#include <stdint.h>

// Detect endianness at compile time
#if defined(__BYTE_ORDER__) && __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
    #define IS_BIG_ENDIAN 1
#else
    #define IS_BIG_ENDIAN 0
#endif

// Byte swap macros
#define SWAP16(x) ((uint16_t)((((x) & 0xFF) << 8) | (((x) >> 8) & 0xFF)))
#define SWAP32(x) ((uint32_t)( \
    (((x) & 0xFF) << 24) | \
    (((x) & 0xFF00) << 8) | \
    (((x) >> 8) & 0xFF00) | \
    (((x) >> 24) & 0xFF) \
))
#define SWAP64(x) ((uint64_t)( \
    (((x) & 0xFFULL) << 56) | \
    (((x) & 0xFF00ULL) << 40) | \
    (((x) & 0xFF0000ULL) << 24) | \
    (((x) & 0xFF000000ULL) << 8) | \
    (((x) >> 8) & 0xFF000000ULL) | \
    (((x) >> 24) & 0xFF0000ULL) | \
    (((x) >> 40) & 0xFF00ULL) | \
    (((x) >> 56) & 0xFFULL) \
))

// Network byte order (big-endian) conversion
static inline uint16_t to_be16(uint16_t x) {
    return IS_BIG_ENDIAN ? x : SWAP16(x);
}

static inline uint32_t to_be32(uint32_t x) {
    return IS_BIG_ENDIAN ? x : SWAP32(x);
}

static inline uint16_t from_be16(uint16_t x) {
    return IS_BIG_ENDIAN ? x : SWAP16(x);
}

static inline uint32_t from_be32(uint32_t x) {
    return IS_BIG_ENDIAN ? x : SWAP32(x);
}

// Little-endian conversion
static inline uint16_t to_le16(uint16_t x) {
    return IS_BIG_ENDIAN ? SWAP16(x) : x;
}

static inline uint32_t to_le32(uint32_t x) {
    return IS_BIG_ENDIAN ? SWAP32(x) : x;
}
```

### 5. Protocol Buffer Generation

Generate Protocol Buffers schema:

```protobuf
syntax = "proto3";

package myprotocol;

option go_package = "github.com/example/myprotocol";

// Message envelope
message Envelope {
    uint32 version = 1;
    uint64 timestamp = 2;
    string correlation_id = 3;
    oneof payload {
        HandshakeRequest handshake_request = 10;
        HandshakeResponse handshake_response = 11;
        DataMessage data = 12;
        Acknowledgment ack = 13;
        ErrorMessage error = 14;
    }
}

message HandshakeRequest {
    string client_id = 1;
    repeated string supported_versions = 2;
    map<string, string> capabilities = 3;
}

message HandshakeResponse {
    bool accepted = 1;
    string selected_version = 2;
    string session_id = 3;
}

message DataMessage {
    uint64 sequence = 1;
    bytes payload = 2;
    bool compressed = 3;
    CompressionType compression_type = 4;
}

enum CompressionType {
    NONE = 0;
    GZIP = 1;
    LZ4 = 2;
    ZSTD = 3;
}

message Acknowledgment {
    uint64 sequence = 1;
    bool success = 2;
}

message ErrorMessage {
    uint32 code = 1;
    string message = 2;
    map<string, string> details = 3;
}
```

### 6. Test Vector Generation

Generate comprehensive test vectors:

```python
import struct
import zlib

def generate_test_vectors():
    """Generate test vectors for protocol parser."""

    test_vectors = []

    # Test 1: Valid minimal message
    header = struct.pack('>BBBBI',
        0xAB,  # magic
        0x01,  # version
        0x02,  # type (DATA)
        0x00,  # flags
        0      # payload length
    )
    crc = zlib.crc32(header) & 0xFFFFFFFF
    message = header + struct.pack('>I', crc)
    test_vectors.append({
        'name': 'valid_minimal',
        'data': message.hex(),
        'expected': 'PARSE_OK',
        'description': 'Valid message with no payload'
    })

    # Test 2: Valid message with payload
    payload = b'Hello, World!'
    header = struct.pack('>BBBBI',
        0xAB, 0x01, 0x02, 0x00, len(payload)
    )
    data = header + payload
    crc = zlib.crc32(data) & 0xFFFFFFFF
    message = data + struct.pack('>I', crc)
    test_vectors.append({
        'name': 'valid_with_payload',
        'data': message.hex(),
        'expected': 'PARSE_OK',
        'description': 'Valid message with text payload'
    })

    # Test 3: Invalid magic byte
    header = struct.pack('>BBBBI', 0xFF, 0x01, 0x02, 0x00, 0)
    crc = zlib.crc32(header) & 0xFFFFFFFF
    message = header + struct.pack('>I', crc)
    test_vectors.append({
        'name': 'invalid_magic',
        'data': message.hex(),
        'expected': 'PARSE_INVALID_MAGIC',
        'description': 'Message with wrong magic byte'
    })

    # Test 4: Invalid CRC
    header = struct.pack('>BBBBI', 0xAB, 0x01, 0x02, 0x00, 0)
    message = header + struct.pack('>I', 0xDEADBEEF)
    test_vectors.append({
        'name': 'invalid_crc',
        'data': message.hex(),
        'expected': 'PARSE_INVALID_CRC',
        'description': 'Message with incorrect CRC'
    })

    # Test 5: Incomplete message
    header = struct.pack('>BBBBI', 0xAB, 0x01, 0x02, 0x00, 100)
    test_vectors.append({
        'name': 'incomplete',
        'data': header.hex(),
        'expected': 'PARSE_INCOMPLETE',
        'description': 'Message with missing payload'
    })

    return test_vectors
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Integration |
|--------|-------------|-------------|
| protoc-gen-go-mcp | Protocol Buffers to MCP translation | gRPC service generation |
| gRPC-to-MCP Proxy | MCP to gRPC protocol translation | Enterprise connectivity |

## Best Practices

1. **Define clear message boundaries** - Use length prefixes or delimiters
2. **Include version fields** - Enable protocol evolution
3. **Use checksums** - Detect corruption in transit
4. **Handle partial reads** - Stream parsing for TCP
5. **Document bit layouts** - Clear specification reduces bugs
6. **Generate test vectors** - Comprehensive test coverage

## Process Integration

This skill integrates with the following processes:
- `binary-protocol-parser.js` - Binary protocol parsing
- `custom-protocol-design.js` - Custom protocol design
- `protocol-state-machine.js` - State machine implementation
- `message-framing.js` - Message framing strategies

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "parse",
  "protocol": "custom-v1",
  "status": "success",
  "message": {
    "type": "DATA",
    "flags": ["COMPRESSED"],
    "payloadLength": 1024,
    "crcValid": true
  },
  "bytesConsumed": 1036,
  "artifacts": ["parser.c", "protocol.h"]
}
```

## Constraints

- Validate all inputs before parsing
- Handle malformed data gracefully
- Set maximum payload limits
- Log parsing errors for debugging
- Test with fuzzing inputs

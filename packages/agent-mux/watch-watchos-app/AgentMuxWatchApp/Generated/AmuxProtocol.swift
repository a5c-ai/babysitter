import Foundation

public enum JSONValue: Codable {
  case string(String)
  case number(Double)
  case bool(Bool)
  case object([String: JSONValue])
  case array([JSONValue])
  case null

  public init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()
    if container.decodeNil() {
      self = .null
    } else if let value = try? container.decode(Bool.self) {
      self = .bool(value)
    } else if let value = try? container.decode(Double.self) {
      self = .number(value)
    } else if let value = try? container.decode(String.self) {
      self = .string(value)
    } else if let value = try? container.decode([String: JSONValue].self) {
      self = .object(value)
    } else if let value = try? container.decode([JSONValue].self) {
      self = .array(value)
    } else {
      throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value.")
    }
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    switch self {
    case .string(let value):
      try container.encode(value)
    case .number(let value):
      try container.encode(value)
    case .bool(let value):
      try container.encode(value)
    case .object(let value):
      try container.encode(value)
    case .array(let value):
      try container.encode(value)
    case .null:
      try container.encodeNil()
    }
  }
}

public enum ProtocolVersion: String, Codable {
  case v1 = "1"
}

public enum HookDecisionFrameDecision: String, Codable {
  case allow = "allow"
  case deny = "deny"
}

public enum HookResolvedFrameDecision: String, Codable {
  case allow = "allow"
  case deny = "deny"
}

public struct AuthFrame: Codable {
  public let type: String
  public let token: String
}

public struct HelloFrame: Codable {
  public let type: String
  public let protocolVersions: [ProtocolVersion]
  public let serverVersion: String
  public let serverTime: String
}

public struct ErrorFrame: Codable {
  public let type: String
  public let code: String
  public let message: String
  public let runId: String?
  public let tailSeq: Double?
}

public struct SubscribeFrame: Codable {
  public let type: String
  public let runId: String
  public let sinceSeq: Double?
}

public struct UnsubscribeFrame: Codable {
  public let type: String
  public let runId: String
}

public struct PingFrame: Codable {
  public let type: String
}

public struct PongFrame: Codable {
  public let type: String
}

public struct RunEventFrame: Codable {
  public let type: String
  public let runId: String
  public let seq: Double
  public let source: String
  public let event: [String: JSONValue]
}

public struct HookRequestFrame: Codable {
  public let type: String
  public let hookRequestId: String
  public let runId: String
  public let hookKind: String
  public let payload: [String: JSONValue]
  public let deadlineTs: Double
}

public struct HookDecisionFrame: Codable {
  public let type: String
  public let hookRequestId: String
  public let decision: HookDecisionFrameDecision
  public let reason: String?
}

public struct HookResolvedFrame: Codable {
  public let type: String
  public let hookRequestId: String
  public let resolvedBy: String
  public let decision: HookResolvedFrameDecision
}

public struct PairingRegisterFrame: Codable {
  public let type: String
  public let code: String
  public let url: String
  public let token: String
}

public struct PairingConsumeFrame: Codable {
  public let type: String
  public let code: String
}

public struct PairingConsumedFrame: Codable {
  public let type: String
  public let code: String
  public let url: String
  public let token: String
  public let expiresAt: Double
}

public enum ClientFrame: Codable {
  case auth(AuthFrame)
  case subscribe(SubscribeFrame)
  case unsubscribe(UnsubscribeFrame)
  case ping(PingFrame)
  case hookDecision(HookDecisionFrame)
  case pairingRegister(PairingRegisterFrame)
  case pairingConsume(PairingConsumeFrame)

  private enum CodingKeys: String, CodingKey {
    case type
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    switch try container.decode(String.self, forKey: .type) {
    case "auth":
      self = .auth(try AuthFrame(from: decoder))
    case "subscribe":
      self = .subscribe(try SubscribeFrame(from: decoder))
    case "unsubscribe":
      self = .unsubscribe(try UnsubscribeFrame(from: decoder))
    case "ping":
      self = .ping(try PingFrame(from: decoder))
    case "hook.decision":
      self = .hookDecision(try HookDecisionFrame(from: decoder))
    case "pairing.register":
      self = .pairingRegister(try PairingRegisterFrame(from: decoder))
    case "pairing.consume":
      self = .pairingConsume(try PairingConsumeFrame(from: decoder))
    default:
      throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown ClientFrame frame type.")
    }
  }

  public func encode(to encoder: Encoder) throws {
    switch self {
    case .auth(let value):
      try value.encode(to: encoder)
    case .subscribe(let value):
      try value.encode(to: encoder)
    case .unsubscribe(let value):
      try value.encode(to: encoder)
    case .ping(let value):
      try value.encode(to: encoder)
    case .hookDecision(let value):
      try value.encode(to: encoder)
    case .pairingRegister(let value):
      try value.encode(to: encoder)
    case .pairingConsume(let value):
      try value.encode(to: encoder)
    }
  }
}

public enum ServerFrame: Codable {
  case hello(HelloFrame)
  case error(ErrorFrame)
  case pong(PongFrame)
  case runEvent(RunEventFrame)
  case hookRequest(HookRequestFrame)
  case hookResolved(HookResolvedFrame)
  case pairingConsumed(PairingConsumedFrame)

  private enum CodingKeys: String, CodingKey {
    case type
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    switch try container.decode(String.self, forKey: .type) {
    case "hello":
      self = .hello(try HelloFrame(from: decoder))
    case "error":
      self = .error(try ErrorFrame(from: decoder))
    case "pong":
      self = .pong(try PongFrame(from: decoder))
    case "run.event":
      self = .runEvent(try RunEventFrame(from: decoder))
    case "hook.request":
      self = .hookRequest(try HookRequestFrame(from: decoder))
    case "hook.resolved":
      self = .hookResolved(try HookResolvedFrame(from: decoder))
    case "pairing.consumed":
      self = .pairingConsumed(try PairingConsumedFrame(from: decoder))
    default:
      throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown ServerFrame frame type.")
    }
  }

  public func encode(to encoder: Encoder) throws {
    switch self {
    case .hello(let value):
      try value.encode(to: encoder)
    case .error(let value):
      try value.encode(to: encoder)
    case .pong(let value):
      try value.encode(to: encoder)
    case .runEvent(let value):
      try value.encode(to: encoder)
    case .hookRequest(let value):
      try value.encode(to: encoder)
    case .hookResolved(let value):
      try value.encode(to: encoder)
    case .pairingConsumed(let value):
      try value.encode(to: encoder)
    }
  }
}

public enum GatewayFrame: Codable {
  case auth(AuthFrame)
  case subscribe(SubscribeFrame)
  case unsubscribe(UnsubscribeFrame)
  case ping(PingFrame)
  case hookDecision(HookDecisionFrame)
  case pairingRegister(PairingRegisterFrame)
  case pairingConsume(PairingConsumeFrame)
  case hello(HelloFrame)
  case error(ErrorFrame)
  case pong(PongFrame)
  case runEvent(RunEventFrame)
  case hookRequest(HookRequestFrame)
  case hookResolved(HookResolvedFrame)
  case pairingConsumed(PairingConsumedFrame)

  private enum CodingKeys: String, CodingKey {
    case type
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    switch try container.decode(String.self, forKey: .type) {
    case "auth":
      self = .auth(try AuthFrame(from: decoder))
    case "subscribe":
      self = .subscribe(try SubscribeFrame(from: decoder))
    case "unsubscribe":
      self = .unsubscribe(try UnsubscribeFrame(from: decoder))
    case "ping":
      self = .ping(try PingFrame(from: decoder))
    case "hook.decision":
      self = .hookDecision(try HookDecisionFrame(from: decoder))
    case "pairing.register":
      self = .pairingRegister(try PairingRegisterFrame(from: decoder))
    case "pairing.consume":
      self = .pairingConsume(try PairingConsumeFrame(from: decoder))
    case "hello":
      self = .hello(try HelloFrame(from: decoder))
    case "error":
      self = .error(try ErrorFrame(from: decoder))
    case "pong":
      self = .pong(try PongFrame(from: decoder))
    case "run.event":
      self = .runEvent(try RunEventFrame(from: decoder))
    case "hook.request":
      self = .hookRequest(try HookRequestFrame(from: decoder))
    case "hook.resolved":
      self = .hookResolved(try HookResolvedFrame(from: decoder))
    case "pairing.consumed":
      self = .pairingConsumed(try PairingConsumedFrame(from: decoder))
    default:
      throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown GatewayFrame frame type.")
    }
  }

  public func encode(to encoder: Encoder) throws {
    switch self {
    case .auth(let value):
      try value.encode(to: encoder)
    case .subscribe(let value):
      try value.encode(to: encoder)
    case .unsubscribe(let value):
      try value.encode(to: encoder)
    case .ping(let value):
      try value.encode(to: encoder)
    case .hookDecision(let value):
      try value.encode(to: encoder)
    case .pairingRegister(let value):
      try value.encode(to: encoder)
    case .pairingConsume(let value):
      try value.encode(to: encoder)
    case .hello(let value):
      try value.encode(to: encoder)
    case .error(let value):
      try value.encode(to: encoder)
    case .pong(let value):
      try value.encode(to: encoder)
    case .runEvent(let value):
      try value.encode(to: encoder)
    case .hookRequest(let value):
      try value.encode(to: encoder)
    case .hookResolved(let value):
      try value.encode(to: encoder)
    case .pairingConsumed(let value):
      try value.encode(to: encoder)
    }
  }
}
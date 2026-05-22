package ai.a5c.agentmux

import kotlinx.serialization.SerialName

import kotlinx.serialization.Serializable

import kotlinx.serialization.json.JsonElement

@Serializable
enum class ProtocolVersion {
  @SerialName("1") V1
}

@Serializable
enum class HookDecisionFrameDecision {
  @SerialName("allow") ALLOW,
  @SerialName("deny") DENY
}

@Serializable
enum class HookResolvedFrameDecision {
  @SerialName("allow") ALLOW,
  @SerialName("deny") DENY
}

@Serializable
sealed interface ClientFrame : GatewayFrame

@Serializable
sealed interface ServerFrame : GatewayFrame

@Serializable
sealed interface GatewayFrame

@Serializable
data class AuthFrame(
  @SerialName("type") val type: String = "auth",
  val token: String
) : ClientFrame

@Serializable
data class HelloFrame(
  @SerialName("type") val type: String = "hello",
  val protocolVersions: List<ProtocolVersion>,
  val serverVersion: String,
  val serverTime: String
) : ServerFrame

@Serializable
data class ErrorFrame(
  @SerialName("type") val type: String = "error",
  val code: String,
  val message: String,
  val runId: String? = null,
  val tailSeq: Double? = null
) : ServerFrame

@Serializable
data class SubscribeFrame(
  @SerialName("type") val type: String = "subscribe",
  val runId: String,
  val sinceSeq: Double? = null
) : ClientFrame

@Serializable
data class UnsubscribeFrame(
  @SerialName("type") val type: String = "unsubscribe",
  val runId: String
) : ClientFrame

@Serializable
data class PingFrame(
  @SerialName("type") val type: String = "ping"
) : ClientFrame

@Serializable
data class PongFrame(
  @SerialName("type") val type: String = "pong"
) : ServerFrame

@Serializable
data class RunEventFrame(
  @SerialName("type") val type: String = "run.event",
  val runId: String,
  val seq: Double,
  val source: String,
  val event: Map<String, JsonElement>
) : ServerFrame

@Serializable
data class HookRequestFrame(
  @SerialName("type") val type: String = "hook.request",
  val hookRequestId: String,
  val runId: String,
  val hookKind: String,
  val payload: Map<String, JsonElement>,
  val deadlineTs: Double
) : ServerFrame

@Serializable
data class HookDecisionFrame(
  @SerialName("type") val type: String = "hook.decision",
  val hookRequestId: String,
  val decision: HookDecisionFrameDecision,
  val reason: String? = null
) : ClientFrame

@Serializable
data class HookResolvedFrame(
  @SerialName("type") val type: String = "hook.resolved",
  val hookRequestId: String,
  val resolvedBy: String,
  val decision: HookResolvedFrameDecision
) : ServerFrame

@Serializable
data class PairingRegisterFrame(
  @SerialName("type") val type: String = "pairing.register",
  val code: String,
  val url: String,
  val token: String
) : ClientFrame

@Serializable
data class PairingConsumeFrame(
  @SerialName("type") val type: String = "pairing.consume",
  val code: String
) : ClientFrame

@Serializable
data class PairingConsumedFrame(
  @SerialName("type") val type: String = "pairing.consumed",
  val code: String,
  val url: String,
  val token: String,
  val expiresAt: Double
) : ServerFrame
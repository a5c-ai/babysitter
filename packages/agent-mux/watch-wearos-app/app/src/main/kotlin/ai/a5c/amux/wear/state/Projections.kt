package ai.a5c.amux.wear.state

data class WearRunProjection(
  val runId: String,
  val agent: String,
  val status: String,
  val costUsd: Double,
  val hasPendingHook: Boolean,
)

object WearProjections {
  fun merge(current: List<WearRunProjection>, incoming: List<WearRunProjection>): List<WearRunProjection> {
    return (current + incoming)
      .associateBy { it.runId }
      .values
      .sortedBy { it.runId }
  }
}

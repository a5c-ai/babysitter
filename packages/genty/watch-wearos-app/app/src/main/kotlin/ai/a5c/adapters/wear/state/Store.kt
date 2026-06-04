package ai.a5c.amux.wear.state

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class WearHookRequest(
  val hookRequestId: String,
  val toolName: String,
  val preview: String,
  val secondsRemaining: Int,
)

class WearStore {
  private val _runs = MutableStateFlow<List<WearRunProjection>>(emptyList())
  val runs: StateFlow<List<WearRunProjection>> = _runs

  private val _pendingHook = MutableStateFlow<WearHookRequest?>(null)
  val pendingHook: StateFlow<WearHookRequest?> = _pendingHook

  val eventBuffer = EventBuffer()

  fun apply(nextRuns: List<WearRunProjection>) {
    _runs.value = WearProjections.merge(_runs.value, nextRuns)
  }

  fun append(node: WearEventNode) {
    eventBuffer.append(node)
  }

  fun setPendingHook(request: WearHookRequest?) {
    _pendingHook.value = request
  }
}

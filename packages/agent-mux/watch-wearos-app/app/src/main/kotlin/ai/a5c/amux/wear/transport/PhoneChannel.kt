package ai.a5c.amux.wear.transport

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class PhoneChannel {
  private val _reachable = MutableStateFlow(true)
  val reachable: StateFlow<Boolean> = _reachable

  fun send(path: String, payload: String) {}

  fun setReachable(value: Boolean) {
    _reachable.value = value
  }
}

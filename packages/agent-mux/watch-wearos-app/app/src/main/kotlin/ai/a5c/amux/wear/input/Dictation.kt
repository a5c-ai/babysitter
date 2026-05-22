package ai.a5c.amux.wear.input

object Dictation {
  fun submit(value: String, onResult: (String) -> Unit) {
    onResult(value)
  }
}

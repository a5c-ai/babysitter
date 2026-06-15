package ai.a5c.adapter.wear.input

object Dictation {
  fun submit(value: String, onResult: (String) -> Unit) {
    onResult(value)
  }
}

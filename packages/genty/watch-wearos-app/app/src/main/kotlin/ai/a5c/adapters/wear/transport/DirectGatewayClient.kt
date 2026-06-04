package ai.a5c.amux.wear.transport

class DirectGatewayClient {
  private var active = false

  fun connect() {
    active = true
  }

  fun disconnect() {
    active = false
  }

  fun send(payload: String) {
    if (!active) {
      connect()
    }
  }
}

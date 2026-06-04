package ai.a5c.amux.wear.transport

class TransportRouter(
  private val phoneChannel: PhoneChannel = PhoneChannel(),
  private val directGatewayClient: DirectGatewayClient = DirectGatewayClient(),
) {
  var preferPhone: Boolean = true

  fun send(path: String, payload: String) {
    if (preferPhone) {
      phoneChannel.send(path, payload)
    } else {
      directGatewayClient.send(payload)
    }
  }
}

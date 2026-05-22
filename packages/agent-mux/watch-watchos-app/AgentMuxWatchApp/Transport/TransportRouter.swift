import Foundation

final class TransportRouter: ObservableObject {
  @Published private(set) var prefersPhone = true
  let phoneChannel: WatchPhoneChannel
  let directGatewayClient: DirectGatewayClient

  init(phoneChannel: WatchPhoneChannel = WatchPhoneChannel(), directGatewayClient: DirectGatewayClient = DirectGatewayClient()) {
    self.phoneChannel = phoneChannel
    self.directGatewayClient = directGatewayClient
  }

  func send(_ data: Data) {
    if phoneChannel.reachable || prefersPhone {
      phoneChannel.send(data)
    } else {
      directGatewayClient.connect()
    }
  }
}

import Foundation

final class DirectGatewayClient {
  private var task: URLSessionWebSocketTask?
  private let session = URLSession(configuration: .ephemeral)

  func connect(url: URL? = nil) {
    guard task == nil, let url else { return }
    task = session.webSocketTask(with: url)
    task?.resume()
  }

  func disconnect() {
    task?.cancel(with: .goingAway, reason: nil)
    task = nil
  }

  func send(_ text: String) {
    task?.send(.string(text)) { _ in }
  }
}

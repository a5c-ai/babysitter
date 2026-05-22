package ai.a5c.amux.wear.state

data class WearEventNode(
  val kind: String,
  val summary: String,
)

class EventBuffer(private val cap: Int = 100) {
  private val nodes = mutableListOf<WearEventNode>()

  fun values(): List<WearEventNode> = nodes.toList()

  fun append(node: WearEventNode) {
    nodes += node
    if (nodes.size > cap) {
      nodes.subList(0, nodes.size - cap).clear()
    }
  }
}

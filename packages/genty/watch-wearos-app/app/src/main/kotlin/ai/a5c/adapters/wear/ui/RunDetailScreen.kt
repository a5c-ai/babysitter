package ai.a5c.adapter.wear.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.compose.material.Text
import ai.a5c.adapter.wear.state.WearStore

@Composable
fun RunDetailScreen(store: WearStore) {
  val nodes = store.eventBuffer.values()
  ScalingLazyColumn(modifier = Modifier.fillMaxSize()) {
    items(nodes.size) { index ->
      Text(text = nodes[index].summary)
    }
  }
}

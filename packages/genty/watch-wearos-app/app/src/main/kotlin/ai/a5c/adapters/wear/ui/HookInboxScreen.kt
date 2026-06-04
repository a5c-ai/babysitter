package ai.a5c.amux.wear.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.compose.material.Text
import ai.a5c.amux.wear.state.WearStore

@Composable
fun HookInboxScreen(store: WearStore, onOpen: () -> Unit = {}) {
  val pendingHook by store.pendingHook.collectAsState()
  ScalingLazyColumn {
    item {
      if (pendingHook == null) {
        Text(text = "No pending hooks", modifier = Modifier.padding(8.dp))
      } else {
        Column(
          modifier = Modifier
            .padding(8.dp)
            .clickable { onOpen() }
        ) {
          Text(text = pendingHook!!.toolName)
          Text(text = pendingHook!!.preview)
        }
      }
    }
  }
}

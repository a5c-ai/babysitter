package ai.a5c.amux.wear.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.compose.material.Text
import ai.a5c.amux.wear.state.WearRunProjection
import ai.a5c.amux.wear.state.WearStore

@Composable
fun RunsListScreen(store: WearStore, onSelect: (WearRunProjection) -> Unit = {}) {
  val runs by store.runs.collectAsState()
  ScalingLazyColumn(modifier = Modifier.fillMaxSize()) {
    items(runs.size) { index ->
      val run = runs[index]
      Column(
        modifier = Modifier
          .padding(8.dp)
          .clickable { onSelect(run) }
      ) {
        Text(text = run.agent)
        Text(text = run.status)
      }
    }
  }
}

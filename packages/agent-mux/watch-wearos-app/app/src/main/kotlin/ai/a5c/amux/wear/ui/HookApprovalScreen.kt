package ai.a5c.amux.wear.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.Text
import ai.a5c.amux.wear.state.WearHookRequest

@Composable
fun HookApprovalScreen(request: WearHookRequest, onAllow: () -> Unit = {}, onDeny: () -> Unit = {}) {
  Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
    Text(text = request.toolName)
    Text(text = request.preview)
    Text(text = "${request.secondsRemaining}s")
    Button(onClick = onAllow) { Text("Allow") }
    Button(onClick = onDeny) { Text("Deny") }
  }
}

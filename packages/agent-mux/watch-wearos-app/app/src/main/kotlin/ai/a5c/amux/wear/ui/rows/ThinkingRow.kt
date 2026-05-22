package ai.a5c.amux.wear.ui.rows

import androidx.compose.runtime.Composable
import androidx.wear.compose.material.Text

@Composable
fun ThinkingRow(summary: String) {
  Text(text = "Thinking: $summary")
}

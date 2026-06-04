package ai.a5c.amux.wear.ui.rows

import androidx.compose.runtime.Composable
import androidx.wear.compose.material.Text

@Composable
fun TextDeltaRow(text: String) {
  Text(text = text, maxLines = 8)
}

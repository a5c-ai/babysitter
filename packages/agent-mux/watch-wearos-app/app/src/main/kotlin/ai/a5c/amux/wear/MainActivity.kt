package ai.a5c.amux.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.remember
import ai.a5c.amux.wear.state.WearStore
import ai.a5c.amux.wear.ui.RunsListScreen

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      val store = remember { WearStore() }
      RunsListScreen(store = store)
    }
  }
}

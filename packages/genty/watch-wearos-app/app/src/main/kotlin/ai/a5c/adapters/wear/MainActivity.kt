package ai.a5c.adapter.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.remember
import ai.a5c.adapter.wear.state.WearStore
import ai.a5c.adapter.wear.ui.RunsListScreen

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      val store = remember { WearStore() }
      RunsListScreen(store = store)
    }
  }
}

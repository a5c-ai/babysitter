package ai.a5c.amux

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class WearableDataLayerBridge(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WearableDataLayerBridge"

  @ReactMethod
  fun sendMessage(path: String, payload: String, promise: Promise) {
    promise.resolve(null)
  }

  @ReactMethod
  fun updateState(payload: String, promise: Promise) {
    promise.resolve(null)
  }

  fun emitIncoming(payload: String) {
    val event = Arguments.createMap()
    event.putString("payload", payload)
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("wearMessage", event)
  }
}

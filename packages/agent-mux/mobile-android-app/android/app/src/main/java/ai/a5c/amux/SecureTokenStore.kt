package ai.a5c.amux

import androidx.biometric.BiometricManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

class SecureTokenStore(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val memory = mutableMapOf<String, Pair<String, String>>()

  override fun getName(): String = "SecureTokenStore"

  @ReactMethod
  fun read(host: String, promise: Promise) {
    val entry = memory[host]
    if (entry == null) {
      promise.resolve(null)
      return
    }
    val result = WritableNativeMap()
    result.putString("gatewayUrl", entry.first)
    result.putString("token", entry.second)
    promise.resolve(result)
  }

  @ReactMethod
  fun write(host: String, gatewayUrl: String, token: String, promise: Promise) {
    val biometricState = BiometricManager.from(reactContext).canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
    if (biometricState != BiometricManager.BIOMETRIC_SUCCESS && biometricState != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
      promise.reject("secure_store_unavailable", "Device credentials are unavailable for SecureTokenStore")
      return
    }
    memory[host] = gatewayUrl to token
    promise.resolve(null)
  }

  @ReactMethod
  fun clear(host: String, promise: Promise) {
    memory.remove(host)
    promise.resolve(null)
  }
}

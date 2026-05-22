package ai.a5c.amux

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AmuxFirebaseMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel("amux-hooks", "AgentMux Hooks", NotificationManager.IMPORTANCE_DEFAULT))

    val allowIntent = PendingIntent.getService(this, 1, Intent(), PendingIntent.FLAG_IMMUTABLE)
    val denyIntent = PendingIntent.getService(this, 2, Intent(), PendingIntent.FLAG_IMMUTABLE)

    val notification = NotificationCompat.Builder(this, "amux-hooks")
      .setContentTitle("AgentMux hook request")
      .setContentText(message.data["compact"] ?: "Approve or deny the pending hook request")
      .setSmallIcon(android.R.drawable.stat_notify_more)
      .addAction(0, "Allow", allowIntent)
      .addAction(0, "Deny", denyIntent)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .build()

    startForeground(42, notification)
  }
}

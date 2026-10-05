package com.izisoft.pp09base.core.firebase

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.izisoft.pp09base.core.R

class AppFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "FCM token: $token")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        createNotificationChannelIfNeeded()

        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: applicationInfo.loadLabel(packageManager).toString()

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: "You have a new message"

        // Open the host app's launcher activity generically (this service lives in :core,
        // which must not reference a concrete Activity class owned by :app).
        val intent = (packageManager.getLaunchIntentForPackage(packageName) ?: Intent()).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        // Create PendingIntent for notification click
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, getString(R.string.fcm_default_channel_id))
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        // POST_NOTIFICATIONS is a runtime (dangerous) permission from API 33+; below that level
        // no check is required. The app requests it via PermissionRequestScreen during onboarding,
        // but this call site must verify it explicitly for lint's static analysis and to avoid
        // relying on a grant that may have been denied or revoked later.
        val canPostNotifications = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

        if (canPostNotifications) {
            NotificationManagerCompat.from(this).notify(System.currentTimeMillis().toInt(), notification)
        } else {
            Log.d(TAG, "Skipped showing notification: POST_NOTIFICATIONS not granted")
        }
    }

    private fun createNotificationChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(NotificationManager::class.java)
        val channelId = getString(R.string.fcm_default_channel_id)
        val existing = manager.getNotificationChannel(channelId)
        if (existing != null) return

        val channel = NotificationChannel(
            channelId,
            getString(R.string.fcm_default_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        )
        manager.createNotificationChannel(channel)
    }

    companion object {
        private const val TAG = "AppFCMService"
    }
}

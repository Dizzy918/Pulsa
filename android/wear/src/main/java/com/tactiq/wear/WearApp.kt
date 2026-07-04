package com.tactiq.wear

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager

class WearApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_LISTENING,
                "Listening status",
                NotificationManager.IMPORTANCE_LOW,
            ).apply { setShowBadge(false) },
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ALERTS,
                "Sound alerts",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Detected sounds delivered as vibration alerts"
                enableVibration(false) // Haptics.kt plays the per-category waveform itself
            },
        )
    }

    companion object {
        const val CHANNEL_LISTENING = "tactiq-wear-listening"
        const val CHANNEL_ALERTS = "tactiq-wear-alerts"
    }
}

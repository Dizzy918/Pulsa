package com.tactiq.wear

import androidx.core.app.NotificationCompat
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

/**
 * Companion mode: the phone did the listening and classification, and pushes
 * the committed detection here over the Data Layer. We vibrate with the rich
 * per-category pattern and surface the alert on the watch face.
 */
class DataListenerService : WearableListenerService() {

    override fun onMessageReceived(event: MessageEvent) {
        if (event.path != DETECTION_PATH) return
        try {
            val json = JSONObject(String(event.data, Charsets.UTF_8))
            val category = json.optString("category")
            val meta = Detections.META[category] ?: return
            val label = json.optString("label", meta.label)
            val confidence = json.optDouble("confidence", 0.0).toFloat()

            Haptics.play(this, category)
            Detections.broadcast(this, category, label, confidence, "phone")

            val manager = getSystemService(android.app.NotificationManager::class.java)
            manager.notify(
                NOTIFICATION_ID,
                NotificationCompat.Builder(this, WearApp.CHANNEL_ALERTS)
                    .setContentTitle("${meta.icon}  $label")
                    .setContentText("${(confidence * 100).toInt()}% · ${meta.urgency}")
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .build(),
            )
        } catch (_: Exception) {
            // Malformed payload — ignore.
        }
    }

    companion object {
        private const val DETECTION_PATH = "/tactiq/detection"
        private const val NOTIFICATION_ID = 2002
    }
}

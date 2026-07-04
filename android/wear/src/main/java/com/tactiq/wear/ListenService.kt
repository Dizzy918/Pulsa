package com.tactiq.wear

import android.Manifest
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.media.AudioRecord
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.tensorflow.lite.task.audio.classifier.AudioClassifier

/**
 * Standalone mode: the watch listens with its own microphone and runs YAMNet
 * locally — the phone can stay at home. Detections vibrate the watch directly.
 */
class ListenService : Service() {

    private var classifier: AudioClassifier? = null
    private var record: AudioRecord? = null
    private val handler = Handler(Looper.getMainLooper())
    private val lastFiredAt = HashMap<String, Long>()

    private val tick = object : Runnable {
        override fun run() {
            classifyOnce()
            handler.postDelayed(this, HOP_MS)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(
            NOTIFICATION_ID,
            buildStatusNotification("Listening on watch mic…"),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        )

        try {
            val c = AudioClassifier.createFromFile(this, MODEL_ASSET)
            classifier = c
            record = c.createAudioRecord().also { it.startRecording() }
            handler.postDelayed(tick, HOP_MS)
            running = true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start audio classification", e)
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    private fun classifyOnce() {
        val c = classifier ?: return
        val r = record ?: return
        try {
            val tensor = c.createInputTensorAudio()
            tensor.load(r)
            val results = c.classify(tensor)
            if (results.isEmpty()) return

            var bestCategory: String? = null
            var bestLabel = ""
            var bestScore = 0f
            for (cat in results[0].categories) {
                val mapped = YamnetMap.byLabel[cat.label.lowercase()] ?: continue
                if (cat.score > bestScore) {
                    bestScore = cat.score
                    bestCategory = mapped
                    bestLabel = cat.label
                }
            }
            if (bestCategory == null || bestScore < SCORE_THRESHOLD) return

            val meta = Detections.META[bestCategory] ?: return
            val now = System.currentTimeMillis()
            if (now - (lastFiredAt[bestCategory] ?: 0L) < meta.minIntervalMs) return
            lastFiredAt[bestCategory] = now

            Haptics.play(this, bestCategory)
            Detections.broadcast(this, bestCategory, bestLabel, bestScore, "watch")

            val manager = getSystemService(android.app.NotificationManager::class.java)
            manager.notify(NOTIFICATION_ID, buildStatusNotification("${meta.icon}  $bestLabel"))
        } catch (e: Exception) {
            Log.w(TAG, "classification tick failed", e)
        }
    }

    private fun buildStatusNotification(text: String): Notification {
        val launch = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, WearApp.CHANNEL_LISTENING)
            .setContentTitle("Pulsa")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setContentIntent(launch)
            .build()
    }

    override fun onDestroy() {
        running = false
        handler.removeCallbacks(tick)
        try { record?.stop() } catch (_: Exception) {}
        record?.release()
        record = null
        classifier?.close()
        classifier = null
        super.onDestroy()
    }

    companion object {
        private const val TAG = "TactiqListen"
        private const val MODEL_ASSET = "yamnet.tflite"
        private const val HOP_MS = 600L
        private const val SCORE_THRESHOLD = 0.25f
        private const val NOTIFICATION_ID = 2001

        @Volatile
        var running = false
            private set
    }
}

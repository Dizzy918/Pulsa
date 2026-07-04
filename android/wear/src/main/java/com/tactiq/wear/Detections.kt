package com.tactiq.wear

import android.content.Context
import android.content.Intent

/**
 * Category metadata mirrored from the phone app's lib/soundClassifier.ts.
 * Keep the two in sync — the vibration patterns are the product's vocabulary,
 * and a deaf user learns them by feel.
 */
data class CategoryMeta(
    val icon: String,
    val label: String,
    val urgency: String,
    // Browser convention [vibrate, gap, vibrate, …]; Haptics prepends the leading 0.
    val pattern: LongArray,
    val minIntervalMs: Long,
)

object Detections {
    const val ACTION_DETECTION = "com.tactiq.wear.DETECTION"
    const val EXTRA_CATEGORY = "category"
    const val EXTRA_LABEL = "label"
    const val EXTRA_ICON = "icon"
    const val EXTRA_CONFIDENCE = "confidence"
    const val EXTRA_SOURCE = "source" // "watch" | "phone"

    val META: Map<String, CategoryMeta> = mapOf(
        "speech" to CategoryMeta("◉", "Someone is speaking", "low", longArrayOf(80, 60, 80), 8000),
        "alarm" to CategoryMeta("▲", "Alarm / Siren", "high", longArrayOf(300, 100, 300, 100, 300, 100, 300), 4000),
        "doorbell" to CategoryMeta("◆", "Doorbell / Knock", "medium", longArrayOf(150, 80, 150), 3000),
        "baby_cry" to CategoryMeta("♥", "Baby crying", "high", longArrayOf(200, 100, 200, 100, 400), 5000),
        "dog_bark" to CategoryMeta("✦", "Dog barking", "medium", longArrayOf(100, 60, 100, 60, 100), 3000),
        "music" to CategoryMeta("♪", "Music playing", "low", longArrayOf(60, 40, 60), 15000),
        "loud_noise" to CategoryMeta("◈", "Loud noise nearby", "medium", longArrayOf(250, 120, 250), 4000),
    )

    /** Notify the UI (MainActivity) that a detection happened. */
    fun broadcast(ctx: Context, category: String, label: String, confidence: Float, source: String) {
        val meta = META[category] ?: return
        val intent = Intent(ACTION_DETECTION)
            .setPackage(ctx.packageName)
            .putExtra(EXTRA_CATEGORY, category)
            .putExtra(EXTRA_LABEL, label.ifEmpty { meta.label })
            .putExtra(EXTRA_ICON, meta.icon)
            .putExtra(EXTRA_CONFIDENCE, confidence)
            .putExtra(EXTRA_SOURCE, source)
        ctx.sendBroadcast(intent)
    }
}

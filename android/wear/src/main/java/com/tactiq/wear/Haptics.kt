package com.tactiq.wear

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Plays the per-category vibration waveform. This is the whole point of the
 * watch app: stock notification vibrations are identical for every alert,
 * while these patterns let the wearer tell an alarm from a doorbell by feel.
 */
object Haptics {
    fun play(ctx: Context, category: String) {
        val meta = Detections.META[category] ?: return
        if (meta.pattern.isEmpty()) return

        val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        // Pattern is [vibrate, gap, …]; createWaveform wants [wait, vibrate, wait, …].
        val timings = LongArray(meta.pattern.size + 1)
        meta.pattern.copyInto(timings, 1)
        vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
    }
}

package com.tactiq.wear

import android.Manifest
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.core.content.ContextCompat

/**
 * Minimal round-screen UI: last detection (glyph + label + source) and a
 * toggle for standalone watch-mic listening. Phone-pushed detections appear
 * here too whenever the activity is open.
 */
class MainActivity : Activity() {

    private lateinit var iconView: TextView
    private lateinit var labelView: TextView
    private lateinit var sourceView: TextView
    private lateinit var toggleButton: Button

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != Detections.ACTION_DETECTION) return
            iconView.text = intent.getStringExtra(Detections.EXTRA_ICON) ?: "◦"
            labelView.text = intent.getStringExtra(Detections.EXTRA_LABEL) ?: ""
            val source = intent.getStringExtra(Detections.EXTRA_SOURCE) ?: ""
            val confidence = (intent.getFloatExtra(Detections.EXTRA_CONFIDENCE, 0f) * 100).toInt()
            sourceView.text = if (source == "watch") "WATCH MIC · $confidence%" else "FROM PHONE · $confidence%"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        iconView = findViewById(R.id.detection_icon)
        labelView = findViewById(R.id.detection_label)
        sourceView = findViewById(R.id.detection_source)
        toggleButton = findViewById(R.id.toggle_button)

        toggleButton.setOnClickListener {
            if (ListenService.running) {
                stopService(Intent(this, ListenService::class.java))
                sourceView.text = getString(R.string.standby)
            } else if (ensurePermissions()) {
                startForegroundService(Intent(this, ListenService::class.java))
                sourceView.text = getString(R.string.listening)
            }
            updateToggle(!ListenService.running)
        }
    }

    override fun onResume() {
        super.onResume()
        val filter = IntentFilter(Detections.ACTION_DETECTION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(receiver, filter)
        }
        updateToggle(ListenService.running)
    }

    override fun onPause() {
        unregisterReceiver(receiver)
        super.onPause()
    }

    private fun updateToggle(running: Boolean) {
        toggleButton.text = getString(if (running) R.string.stop_listening else R.string.start_listening)
    }

    private fun ensurePermissions(): Boolean {
        val needed = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) needed += Manifest.permission.RECORD_AUDIO
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) needed += Manifest.permission.POST_NOTIFICATIONS

        if (needed.isEmpty()) return true
        requestPermissions(needed.toTypedArray(), 1)
        return false
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        if (code == 1 && results.all { it == PackageManager.PERMISSION_GRANTED }) {
            startForegroundService(Intent(this, ListenService::class.java))
            updateToggle(true)
        }
    }
}

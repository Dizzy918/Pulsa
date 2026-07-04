package com.tactiq.app

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.wearable.Wearable

/**
 * JS-facing bridge with two responsibilities:
 *  - push committed detections to any connected Wear OS node over the Data Layer
 *  - hold a microphone foreground service so listening survives screen-off
 *
 * Every method resolves (never rejects): a phone without Google Play services
 * (e.g. Huawei) or without a paired watch simply resolves false, and the JS
 * side falls back to notification mirroring.
 */
class WearBridgeModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    override fun getName() = "WearBridge"

    @ReactMethod
    fun sendDetection(json: String, promise: Promise) {
        try {
            Wearable.getNodeClient(ctx).connectedNodes
                .addOnSuccessListener { nodes ->
                    if (nodes.isEmpty()) {
                        promise.resolve(false)
                        return@addOnSuccessListener
                    }
                    val client = Wearable.getMessageClient(ctx)
                    val bytes = json.toByteArray(Charsets.UTF_8)
                    for (node in nodes) {
                        client.sendMessage(node.id, DETECTION_PATH, bytes)
                    }
                    promise.resolve(true)
                }
                .addOnFailureListener { promise.resolve(false) }
        } catch (e: Exception) {
            // Play services entirely absent throws synchronously.
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun startListeningService(promise: Promise) {
        try {
            val intent = Intent(ctx, ListeningService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent)
            } else {
                ctx.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun stopListeningService(promise: Promise) {
        ctx.stopService(Intent(ctx, ListeningService::class.java))
        promise.resolve(true)
    }

    companion object {
        const val DETECTION_PATH = "/tactiq/detection"
    }
}

package com.zekaicann.hush

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * BroadcastReceiver that listens for app install/uninstall/update events
 * and notifies React Native to refresh the app list.
 */
class AppChangeReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AppChangeReceiver"
        const val EVENT_SMART_APPS_CHANGED = "SmartAppsChanged"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val action = intent.action ?: return
        val packageName = intent.data?.schemeSpecificPart

        Log.d(TAG, "Received action: $action for package: $packageName")

        when (action) {
            Intent.ACTION_PACKAGE_ADDED,
            Intent.ACTION_PACKAGE_REMOVED,
            Intent.ACTION_PACKAGE_REPLACED -> {
                // Emit event to React Native
                emitAppChangeEvent(context)
            }
        }
    }

    private fun emitAppChangeEvent(context: Context) {
        try {
            val reactApplication = context.applicationContext as? ReactApplication
            if (reactApplication == null) {
                Log.w(TAG, "Application is not a ReactApplication")
                return
            }

            val reactNativeHost = reactApplication.reactNativeHost
            val reactInstanceManager = reactNativeHost.reactInstanceManager
            val reactContext = reactInstanceManager.currentReactContext

            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                sendEvent(reactContext)
            } else {
                Log.d(TAG, "ReactContext not available, event will be picked up on next app open")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error emitting app change event", e)
        }
    }

    private fun sendEvent(reactContext: ReactContext) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_SMART_APPS_CHANGED, null)
            
            Log.d(TAG, "Emitted $EVENT_SMART_APPS_CHANGED event to React Native")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit event", e)
        }
    }
}

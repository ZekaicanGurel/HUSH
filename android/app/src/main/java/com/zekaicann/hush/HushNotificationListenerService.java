package com.zekaicann.hush;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactApplication;
import android.os.Handler;
import android.os.Looper;

public class HushNotificationListenerService extends NotificationListenerService {

    private static final String TAG = "HushListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Log.d(TAG, "Notification received from: " + packageName);

        // Read blocked packages
        android.content.SharedPreferences prefs = getSharedPreferences("hush_native_prefs",
                android.content.Context.MODE_PRIVATE);
        java.util.Set<String> blocked = prefs.getStringSet("blocked_packages", new java.util.HashSet<>());

        boolean isBlocked = blocked.contains(packageName);

        if (isBlocked) {
            cancelNotification(sbn.getKey());
            Log.d(TAG, "Blocked notification from: " + packageName);
        }

        // Emit event to React Native
        emitEvent(packageName, sbn.getNotification().extras.getString("android.title"), isBlocked);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Handle removal if needed
    }

    private void emitEvent(String packageName, String title, boolean isBlocked) {
        try {
            ReactApplication reactApplication = (ReactApplication) getApplication();
            ReactNativeHost reactNativeHost = reactApplication.getReactNativeHost();
            ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
            ReactApplicationContext reactContext = (ReactApplicationContext) reactInstanceManager
                    .getCurrentReactContext();

            if (reactContext != null) {
                com.facebook.react.bridge.WritableMap params = com.facebook.react.bridge.Arguments.createMap();
                params.putString("packageName", packageName);
                params.putString("title", title);
                params.putDouble("timestamp", System.currentTimeMillis());
                params.putBoolean("wasBlocked", isBlocked);

                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onNotificationReceived", params);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error emitting event", e);
        }
    }
}

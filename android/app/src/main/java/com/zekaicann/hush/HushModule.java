package com.zekaicann.hush;

import android.content.Intent;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.util.Set;

public class HushModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public HushModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "HushModule";
    }

    @ReactMethod
    public void isNotificationAccessGranted(Promise promise) {
        Set<String> enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(reactContext);
        String packageName = reactContext.getPackageName();
        promise.resolve(enabledListeners.contains(packageName));
    }

    @ReactMethod
    public void openNotificationAccessSettings() {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void setBlockedApps(com.facebook.react.bridge.ReadableArray packages) {
        android.content.SharedPreferences prefs = reactContext.getSharedPreferences("hush_native_prefs",
                android.content.Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();

        java.util.HashSet<String> set = new java.util.HashSet<>();
        for (int i = 0; i < packages.size(); i++) {
            set.add(packages.getString(i));
        }

        editor.putStringSet("blocked_packages", set);
        editor.apply();
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            android.content.pm.PackageManager pm = reactContext.getPackageManager();
            java.util.List<android.content.pm.PackageInfo> packages = pm.getInstalledPackages(0);

            com.facebook.react.bridge.WritableArray appList = com.facebook.react.bridge.Arguments.createArray();

            for (android.content.pm.PackageInfo packageInfo : packages) {
                // Filter out system apps roughly (or apps without launch intent)
                if (pm.getLaunchIntentForPackage(packageInfo.packageName) != null) {
                    com.facebook.react.bridge.WritableMap appMap = com.facebook.react.bridge.Arguments.createMap();
                    appMap.putString("packageName", packageInfo.packageName);
                    appMap.putString("appName", pm.getApplicationLabel(packageInfo.applicationInfo).toString());
                    appList.pushMap(appMap);
                }
            }
            promise.resolve(appList);
        } catch (Exception e) {
            promise.reject("ERR_PACKAGES", e);
        }
    }
}

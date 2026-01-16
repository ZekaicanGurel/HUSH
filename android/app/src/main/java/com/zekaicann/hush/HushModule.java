package com.zekaicann.hush;

import android.content.Intent;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.util.Set;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;

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
    public void scheduleAlarm(String id, double timestamp, String data) {
        AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(reactContext, AlarmReceiver.class);
        intent.setAction("com.zekaicann.hush.ALARM_TRIGGER");
        intent.putExtra("id", id);
        intent.putExtra("data", data);

        // Use hashcode of idString for unique request code
        int requestCode = id.hashCode();

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, (long) timestamp, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, (long) timestamp, pendingIntent);
        }
    }

    @ReactMethod
    public void cancelAlarm(String id) {
        AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(reactContext, AlarmReceiver.class);
        intent.setAction("com.zekaicann.hush.ALARM_TRIGGER");

        int requestCode = id.hashCode();

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        alarmManager.cancel(pendingIntent);
    }

    @ReactMethod
    public void updateWidget(String statusText, boolean isActive) {
        try {
            Context context = getReactApplicationContext();
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, HushWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);

            for (int appWidgetId : appWidgetIds) {
                HushWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId, statusText, isActive);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void getInitialAction(Promise promise) {
        try {
            if (getCurrentActivity() != null) {
                Intent intent = getCurrentActivity().getIntent();
                String action = intent.getStringExtra("launchAction");
                promise.resolve(action);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.resolve(null);
        }
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
        // Null guard to prevent crash from malformed React Native bridge payloads
        if (packages == null) {
            android.util.Log.w("HushModule", "setBlockedApps called with null packages array");
            return;
        }

        android.content.SharedPreferences prefs = reactContext.getSharedPreferences("hush_native_prefs",
                android.content.Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();

        java.util.HashSet<String> set = new java.util.HashSet<>();
        for (int i = 0; i < packages.size(); i++) {
            String pkg = packages.getString(i);
            if (pkg != null) {
                set.add(pkg);
            }
        }

        editor.putStringSet("blocked_packages", set);
        editor.apply();
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            android.content.pm.PackageManager pm = reactContext.getPackageManager();

            // Query apps with launcher intent (user-facing apps that appear in home screen)
            android.content.Intent launcherIntent = new android.content.Intent(android.content.Intent.ACTION_MAIN,
                    null);
            launcherIntent.addCategory(android.content.Intent.CATEGORY_LAUNCHER);

            java.util.List<android.content.pm.ResolveInfo> resolveInfoList = pm.queryIntentActivities(launcherIntent,
                    0);

            com.facebook.react.bridge.WritableArray appList = com.facebook.react.bridge.Arguments.createArray();
            java.util.HashSet<String> addedPackages = new java.util.HashSet<>();

            for (android.content.pm.ResolveInfo resolveInfo : resolveInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;

                // Skip if already added (avoid duplicates)
                if (addedPackages.contains(packageName)) {
                    continue;
                }

                // Filter out system/overlay/internal packages
                if (shouldExcludePackage(packageName)) {
                    continue;
                }

                // Get app label
                String appName;
                try {
                    android.content.pm.ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
                    appName = pm.getApplicationLabel(appInfo).toString();
                } catch (android.content.pm.PackageManager.NameNotFoundException e) {
                    appName = packageName;
                }

                // Skip apps with no readable name
                if (appName == null || appName.isEmpty()) {
                    continue;
                }

                com.facebook.react.bridge.WritableMap appMap = com.facebook.react.bridge.Arguments.createMap();
                appMap.putString("packageName", packageName);
                appMap.putString("appName", appName);
                appList.pushMap(appMap);
                addedPackages.add(packageName);
            }

            promise.resolve(appList);
        } catch (Exception e) {
            android.util.Log.e("HushModule", "Error getting installed apps", e);
            promise.reject("ERR_PACKAGES", e);
        }
    }

    /**
     * Check if a package should be excluded from the user-facing app list.
     * Filters out system overlays, internal services, and non-user apps.
     */
    private boolean shouldExcludePackage(String packageName) {
        if (packageName == null)
            return true;

        // Exclude our own app
        if (packageName.equals(reactContext.getPackageName())) {
            return true;
        }

        // List of prefixes for system/internal packages to exclude
        String[] excludedPrefixes = {
                // Android system packages
                "com.android.",
                "android.",

                // Google system components
                "com.google.android.overlay",
                "com.google.android.permissioncontroller",
                "com.google.android.permission",
                "com.google.android.providers",
                "com.google.android.ext.",
                "com.google.android.captiveportallogin",
                "com.google.android.packageinstaller",
                "com.google.android.webview",
                "com.google.android.networkstack",
                "com.google.android.cellbroadcastreceiver",
                "com.google.android.feedback",
                "com.google.android.printservice",
                "com.google.android.modulemetadata",
                "com.google.android.configupdater",
                "com.google.android.gsf",
                "com.google.android.partnersetup",
                "com.google.android.setupwizard",
                "com.google.android.onetimeinitializer",
                "com.google.android.tts",
                "com.google.android.syncadapters",
                "com.google.android.backuptransport",
                "com.google.android.inputmethod.latin",

                // Samsung system components
                "com.samsung.android.provider",
                "com.samsung.android.knox",
                "com.samsung.android.mdm",
                "com.samsung.android.incallui",
                "com.samsung.android.dialer",
                "com.samsung.android.messaging",
                "com.sec.android.",

                // Xiaomi/MIUI system components
                "com.miui.system",
                "com.miui.securitycenter",
                "com.miui.core",
                "com.miui.rom",
                "com.miui.analytics",
                "com.xiaomi.simactivate",
                "com.xiaomi.xmsf",

                // Huawei system components
                "com.huawei.hwid",
                "com.huawei.systemmanager",
                "com.huawei.android.launcher",

                // Other OEM system apps
                "com.oppo.",
                "com.vivo.",
                "com.realme.",
                "com.oneplus.config",
                "com.qualcomm.",
                "com.qti.",

                // Development tools
                "host.exp.exponent", // Expo Go

                // Emulator services
                "com.android.emulator",
                "com.google.android.gms.supervision",
        };

        for (String prefix : excludedPrefixes) {
            if (packageName.startsWith(prefix)) {
                return true;
            }
        }

        // Also exclude if it contains system-related keywords
        if (packageName.contains(".overlay.") ||
                packageName.contains(".overlay") ||
                packageName.contains(".provider.") ||
                packageName.contains(".providers.") ||
                packageName.contains(".config.") ||
                packageName.contains("systemui") ||
                packageName.contains("permissioncontroller") ||
                packageName.contains("inputmethod") ||
                packageName.contains("webview") ||
                packageName.contains("backup") ||
                packageName.contains("tethering") ||
                packageName.endsWith(".overlay") ||
                packageName.endsWith(".service") ||
                packageName.endsWith(".config")) {
            return true;
        }

        return false;
    }
}

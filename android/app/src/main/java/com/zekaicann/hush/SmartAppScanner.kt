package com.zekaicann.hush

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream

class SmartAppScanner(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var listenerCount = 0

    override fun getName(): String = "SmartAppScanner"

    // Required for NativeEventEmitter - tracks listener registration
    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
    }

    // Required for NativeEventEmitter - cleans up listeners
    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount < 0) listenerCount = 0
    }

    // Whitelisted system app categories that users care about
    private val whitelistedSystemApps = setOf(
        // Messaging/SMS
        "com.google.android.apps.messaging",
        "com.samsung.android.messaging",
        "com.android.mms",
        
        // Phone/Dialer
        "com.google.android.dialer",
        "com.samsung.android.dialer",
        "com.android.phone",
        
        // Email
        "com.google.android.gm",
        "com.microsoft.office.outlook",
        "com.samsung.android.email.provider",
        
        // Maps
        "com.google.android.apps.maps",
        "com.waze",
        
        // Calendar
        "com.google.android.calendar",
        "com.samsung.android.calendar",
        
        // Clock/Alarms
        "com.google.android.deskclock",
        "com.samsung.android.app.clockpack",
        "com.android.deskclock",
        
        // Camera
        "com.google.android.GoogleCamera",
        "com.samsung.android.app.camera",
        
        // Contacts
        "com.google.android.contacts",
        "com.samsung.android.contacts",
    )

    // Hard-blocked packages that should NEVER appear
    private val blockedPatterns = listOf(
        "com.android.permissioncontroller",
        "com.android.systemui",
        "com.android.networkstack",
        "com.google.android.gms",
        "com.google.android.overlay",
        "com.google.android.marvin",
        "com.google.android.webview",
        "com.google.android.gsf",
        "com.google.android.providers",
        "com.google.android.ext.",
        "com.google.android.tts",
        "com.google.android.inputmethod",
        "com.google.android.packageinstaller",
        "com.android.providers",
        "com.android.server",
        "com.android.settings",
        "com.android.shell",
        "com.android.vending", // Play Store itself
        "com.android.documentsui",
        "com.android.externalstorage",
        "com.android.htmlviewer",
        "com.android.printspooler",
        "android.",
        ".overlay",
        ".provider",
        ".config",
        "webview",
        "inputmethod",
    )

    // App category mapping
    private val categoryPatterns = mapOf(
        "Social" to listOf("whatsapp", "instagram", "facebook", "twitter", "telegram", "tiktok", "snapchat", "discord", "reddit", "linkedin", "pinterest"),
        "Finance" to listOf("bank", "pay", "wallet", "finance", "money", "credit", "invest", "stock", "crypto", "binance", "revolut"),
        "Work" to listOf("slack", "teams", "zoom", "meet", "office", "docs", "sheets", "drive", "notion", "trello", "asana", "jira"),
        "System Important" to listOf("messaging", "dialer", "phone", "sms", "email", "gmail", "calendar", "clock", "alarm", "contacts"),
    )

    @ReactMethod
    fun getRelevantApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val installedApps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val result = Arguments.createArray()
            val addedPackages = mutableSetOf<String>()

            for (appInfo in installedApps) {
                val packageName = appInfo.packageName

                // Skip duplicates
                if (addedPackages.contains(packageName)) continue

                // Skip hard-blocked packages
                if (isBlocked(packageName)) continue

                // Determine if app should be included
                val isFromPlayStore = isInstalledFromPlayStore(pm, packageName)
                val isWhitelistedSystem = whitelistedSystemApps.contains(packageName)
                val hasLauncherIntent = hasLauncherActivity(pm, packageName)

                // Include only: Play Store apps OR whitelisted system apps
                if (!isFromPlayStore && !isWhitelistedSystem) continue

                // Must have a launcher activity (user can open it)
                if (!hasLauncherIntent && !isWhitelistedSystem) continue

                // Get app details
                val appName = try {
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    packageName
                }

                // Skip apps with no readable name
                if (appName.isBlank()) continue

                // Get app icon as Base64
                val iconBase64 = try {
                    getAppIconBase64(pm, packageName)
                } catch (e: Exception) {
                    ""
                }

                // Check if it's a system app
                val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                // Build app info map
                val appMap = Arguments.createMap().apply {
                    putString("packageName", packageName)
                    putString("appName", appName)
                    putString("iconBase64", iconBase64)
                    putBoolean("isSystemApp", isSystemApp)
                    putBoolean("isFromPlayStore", isFromPlayStore)
                    putString("category", categorizeApp(packageName, appName))
                }

                result.pushMap(appMap)
                addedPackages.add(packageName)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERR_SCAN_APPS", e.message, e)
        }
    }

    private fun isBlocked(packageName: String): Boolean {
        // Check own package
        if (packageName == reactContext.packageName) return true

        // Check blocked patterns
        for (pattern in blockedPatterns) {
            if (packageName.contains(pattern, ignoreCase = true)) return true
        }

        return false
    }

    private fun isInstalledFromPlayStore(pm: PackageManager, packageName: String): Boolean {
        return try {
            val installer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                pm.getInstallSourceInfo(packageName).installingPackageName
            } else {
                @Suppress("DEPRECATION")
                pm.getInstallerPackageName(packageName)
            }
            installer == "com.android.vending" || installer == "com.google.android.feedback"
        } catch (e: Exception) {
            false
        }
    }

    private fun hasLauncherActivity(pm: PackageManager, packageName: String): Boolean {
        val intent = pm.getLaunchIntentForPackage(packageName)
        return intent != null
    }

    private fun getAppIconBase64(pm: PackageManager, packageName: String): String {
        val drawable = pm.getApplicationIcon(packageName)
        val bitmap = drawableToBitmap(drawable)
        
        // Scale down for performance (48dp)
        val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 96, 96, true)
        
        val outputStream = ByteArrayOutputStream()
        scaledBitmap.compress(Bitmap.CompressFormat.PNG, 80, outputStream)
        val byteArray = outputStream.toByteArray()
        
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }

        val bitmap = if (drawable.intrinsicWidth <= 0 || drawable.intrinsicHeight <= 0) {
            Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
        } else {
            Bitmap.createBitmap(drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
        }

        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun categorizeApp(packageName: String, appName: String): String {
        val searchText = "$packageName $appName".lowercase()
        
        for ((category, patterns) in categoryPatterns) {
            for (pattern in patterns) {
                if (searchText.contains(pattern)) {
                    return category
                }
            }
        }
        
        return "Other"
    }
}

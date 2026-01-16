package com.zekaicann.hush;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String dataStr = intent.getStringExtra("data");
            if (dataStr == null)
                return;

            JSONObject data = new JSONObject(dataStr);
            String type = data.optString("type");
            String modeId = data.optString("modeId");

            String title = "Focus Mode Update";
            String message = "Your focus schedule is running.";

            if ("focus_start".equals(type)) {
                title = "Focus Mode Started";
                message = "Time to focus! Mode activated.";
            } else if ("focus_end".equals(type)) {
                title = "Focus Mode Ended";
                message = "Session complete.";
            }

            createNotificationChannel(context);

            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, appIntent,
                    PendingIntent.FLAG_IMMUTABLE);

            int iconResId = context.getResources().getIdentifier("ic_notification", "drawable",
                    context.getPackageName());
            if (iconResId == 0)
                iconResId = android.R.drawable.ic_lock_idle_alarm;

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "hush_focus_updates")
                    .setSmallIcon(iconResId)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true);

            NotificationManager notificationManager = (NotificationManager) context
                    .getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.notify(modeId != null ? modeId.hashCode() : 1, builder.build());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Focus Updates";
            String description = "Notifications for scheduled focus modes";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel("hush_focus_updates", name, importance);
            channel.setDescription(description);
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
}

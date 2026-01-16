package com.zekaicann.hush;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class HushWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            // Default state initialization
            updateAppWidget(context, appWidgetManager, appWidgetId, "Open HUSH", false);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId,
            String statusText, boolean isActive) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hush_widget);

        views.setTextViewText(R.id.widget_status, statusText);
        views.setTextViewText(R.id.widget_button, isActive ? "Stop Focus" : "Start Focus");
        views.setImageViewResource(R.id.status_dot, isActive ? R.drawable.dot_active : R.drawable.dot_inactive);

        // Button Logic: Open App with action
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("launchAction", "toggle_focus");
        intent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}

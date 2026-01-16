/**
 * Focus Suggestions Hook
 * 
 * Rule-based AI suggestions for Focus Intelligence.
 * Detects patterns and provides actionable recommendations.
 */

import { useMemo } from 'react';
import { useFocusSessionStore } from '../store/focusSessionStore';
import { useHushStore } from '../store/useHushStore';
import { format, getHours, getDay, subDays, startOfDay } from 'date-fns';
import { useI18nStore } from '../i18n';

export interface FocusSuggestion {
    id: string;
    type: 'schedule' | 'app_block' | 'mode_recommendation';
    title: string;
    description: string;
    actionLabel: string;
    data: {
        modeId?: string;
        modeName?: string;
        time?: string;
        packageName?: string;
        appName?: string;
    };
    priority: number; // 1 = highest
}

export const useFocusSuggestions = (): FocusSuggestion[] => {
    const sessions = useFocusSessionStore(s => s.sessions || []);
    const blockedNotifications = useFocusSessionStore(s => s.blockedNotifications || []);
    const getTopDistractingApps = useFocusSessionStore(s => s.getTopDistractingApps);
    const focusModes = useHushStore(s => s.focusModes || []);
    const dismissedIds = useHushStore(s => s.dismissedSuggestionIds || []);
    const smartSuggestionsEnabled = useHushStore(s => s.smartSuggestionsEnabled ?? true);
    const { t } = useI18nStore();

    const suggestions = useMemo(() => {
        if (!smartSuggestionsEnabled) return [];

        const result: FocusSuggestion[] = [];

        // === RULE 1: Time Pattern Detection ===
        // If user activates same mode at similar time for 3+ days
        const recentDays = 7;

        const sessionsByMode: Record<string, { hour: number; day: number }[]> = {};

        sessions
            .filter(s => s.startTime >= subDays(new Date(), recentDays).getTime())
            .forEach(s => {
                if (!sessionsByMode[s.modeId]) {
                    sessionsByMode[s.modeId] = [];
                }
                sessionsByMode[s.modeId].push({
                    hour: getHours(s.startTime),
                    day: getDay(s.startTime),
                });
            });

        Object.entries(sessionsByMode).forEach(([modeId, times]) => {
            if (times.length < 3) return;

            // Group by hour (with threshold)
            const hourCounts: Record<number, number> = {};
            times.forEach(t => {
                const roundedHour = t.hour;
                hourCounts[roundedHour] = (hourCounts[roundedHour] || 0) + 1;
            });

            // Check if any hour has 3+ occurrences
            Object.entries(hourCounts).forEach(([hour, count]) => {
                const hourNum = parseInt(hour, 10);
                if (count >= 3) {
                    const mode = focusModes.find(m => m.id === modeId);
                    if (mode) {
                        const timeStr = `${hourNum.toString().padStart(2, '0')}:00`;
                        result.push({
                            id: `schedule-${modeId}-${hourNum}`,
                            type: 'schedule',
                            title: t('suggestion_automate_title', { mode: mode.name, time: timeStr }),
                            description: t('suggestion_automate_desc', { mode: mode.name, time: timeStr }),
                            actionLabel: t('suggestion_automate_action'),
                            data: {
                                modeId,
                                modeName: mode.name,
                                time: timeStr,
                            },
                            priority: 1,
                        });
                    }
                }
            });
        });

        // === RULE 2: Top Distraction App ===
        // If one app causes > 40% of interruptions
        const topApps = getTopDistractingApps(3);
        const totalBlocked = blockedNotifications.length || 1;

        topApps.forEach((app, index) => {
            const percentage = Math.round((app.count / totalBlocked) * 100);

            if (percentage >= 40 && index === 0) {
                result.push({
                    id: `app-block-${app.packageName}`,
                    type: 'app_block',
                    title: t('suggestion_block_title', { app: app.appName }),
                    description: t('suggestion_block_desc', { app: app.appName, percent: percentage }),
                    actionLabel: t('suggestion_block_action'),
                    data: {
                        packageName: app.packageName,
                        appName: app.appName,
                    },
                    priority: 2,
                });
            }
        });

        // === RULE 3: Mode Effectiveness ===
        // Suggest most effective mode if user hasn't used it in a while
        const mostUsedModeData = useFocusSessionStore.getState().getMostUsedMode();
        if (mostUsedModeData && mostUsedModeData.count >= 5) {
            const lastSession = sessions
                .filter(s => s.modeId === mostUsedModeData.modeId)
                .sort((a, b) => b.startTime - a.startTime)[0];

            const daysSinceLastUse = lastSession
                ? Math.floor((Date.now() - lastSession.startTime) / (1000 * 60 * 60 * 24))
                : 999;

            if (daysSinceLastUse >= 2) {
                result.push({
                    id: `mode-rec-${mostUsedModeData.modeId}`,
                    type: 'mode_recommendation',
                    title: t('suggestion_dopamine_title', { mode: mostUsedModeData.modeName }),
                    description: t('suggestion_dopamine_desc', { mode: mostUsedModeData.modeName, count: mostUsedModeData.count }),
                    actionLabel: t('suggestion_dopamine_action'),
                    data: {
                        modeId: mostUsedModeData.modeId,
                        modeName: mostUsedModeData.modeName,
                    },
                    priority: 3,
                });
            }
        }

        // Sort by priority and filter dismissed
        return result
            .filter(s => !dismissedIds.includes(s.id))
            .sort((a, b) => a.priority - b.priority);
    }, [sessions, blockedNotifications, focusModes, dismissedIds, getTopDistractingApps, smartSuggestionsEnabled, t]);

    return suggestions;
};

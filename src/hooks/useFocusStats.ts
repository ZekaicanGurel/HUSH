/**
 * Focus Stats Hook
 * 
 * Provides computed Focus Intelligence statistics for UI components.
 * Wraps focusSessionStore with reactive Zustand selectors.
 */

import { useMemo } from 'react';
import { useFocusSessionStore } from '../store/focusSessionStore';
import { useHushStore } from '../store/useHushStore';

export interface FocusStats {
    // Today
    todayBlockedCount: number;
    todayFocusMinutes: number;

    // This week
    weekBlockedCount: number;
    weekFocusMinutes: number;

    // Top apps
    topDistractingApps: Array<{
        packageName: string;
        appName: string;
        count: number;
        percentage: number;
    }>;

    // Mode stats
    mostUsedMode: {
        modeId: string;
        modeName: string;
        count: number;
    } | null;

    // Active session
    isSessionActive: boolean;
    currentSessionMinutes: number;
}

export const useFocusStats = (): FocusStats => {
    const getTodayBlockedCount = useFocusSessionStore(s => s.getTodayBlockedCount);
    const getWeekBlockedCount = useFocusSessionStore(s => s.getWeekBlockedCount);
    const getTodayFocusMinutes = useFocusSessionStore(s => s.getTodayFocusMinutes);
    const getWeekFocusMinutes = useFocusSessionStore(s => s.getWeekFocusMinutes);
    const getTopDistractingApps = useFocusSessionStore(s => s.getTopDistractingApps);
    const getMostUsedMode = useFocusSessionStore(s => s.getMostUsedMode);
    const currentSession = useFocusSessionStore(s => s.currentSession);
    const blockedNotifications = useFocusSessionStore(s => s.blockedNotifications || []);

    // Re-compute when store updates (blockedNotifications triggers re-render)
    const stats = useMemo(() => {
        const todayBlocked = getTodayBlockedCount();
        const weekBlocked = getWeekBlockedCount();
        const topApps = getTopDistractingApps(5);

        // Calculate percentages for top apps
        const totalWeekBlocked = weekBlocked || 1; // Avoid division by zero
        const topAppsWithPercentage = topApps.map(app => ({
            ...app,
            percentage: Math.round((app.count / totalWeekBlocked) * 100),
        }));

        const currentSessionMinutes = currentSession
            ? Math.floor((Date.now() - currentSession.startTime) / (1000 * 60))
            : 0;

        return {
            todayBlockedCount: todayBlocked,
            todayFocusMinutes: getTodayFocusMinutes(),
            weekBlockedCount: weekBlocked,
            weekFocusMinutes: getWeekFocusMinutes(),
            topDistractingApps: topAppsWithPercentage,
            mostUsedMode: getMostUsedMode(),
            isSessionActive: !!currentSession,
            currentSessionMinutes,
        };
    }, [blockedNotifications, currentSession]);

    return stats;
};

/**
 * Format minutes to human readable string
 */
export const formatFocusTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}dk`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
};

/**
 * Get empowering message based on blocked count
 */
export const getEmpoweringMessage = (blockedCount: number): string => {
    if (blockedCount === 0) {
        return "Bugün odağını korumaya hazırsın!";
    }
    if (blockedCount < 10) {
        return "Güzel başlangıç! Odağını koruyorsun.";
    }
    if (blockedCount < 50) {
        return "Harika gidiyorsun! Dikkat dağıtıcılara direniyorsun.";
    }
    if (blockedCount < 100) {
        return "İnanılmaz! Odağın çelik gibi güçlü.";
    }
    return "Efsane! Tam bir odak şampiyonusun!";
};

/**
 * Focus Session Store
 * 
 * Tracks Focus Mode sessions and blocked notifications for Focus Intelligence.
 * Persists data using Zustand + AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, startOfWeek, subDays } from 'date-fns';

// Types
export interface FocusSession {
    id: string;
    modeId: string;
    modeName: string;
    startTime: number;
    endTime: number | null;
    isActive: boolean;
}

export interface BlockedNotification {
    id: string;
    timestamp: number;
    packageName: string;
    appName: string;
    modeId: string | null;
    modeName: string | null;
}

export interface AppBlockCount {
    packageName: string;
    appName: string;
    count: number;
}

interface FocusSessionState {
    // Sessions
    sessions: FocusSession[];
    currentSession: FocusSession | null;

    // Blocked notifications log
    blockedNotifications: BlockedNotification[];

    // Actions
    startSession: (modeId: string, modeName: string) => void;
    endSession: () => void;
    recordBlockedNotification: (packageName: string, appName: string) => void;

    // Computed stats (getters)
    getTodayBlockedCount: () => number;
    getWeekBlockedCount: () => number;
    getTodayFocusMinutes: () => number;
    getWeekFocusMinutes: () => number;
    getTopDistractingApps: (limit?: number) => AppBlockCount[];
    getMostUsedMode: () => { modeId: string; modeName: string; count: number } | null;

    // Cleanup
    cleanupOldData: () => void;
}

export const useFocusSessionStore = create<FocusSessionState>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSession: null,
            blockedNotifications: [],

            startSession: (modeId, modeName) => {
                const session: FocusSession = {
                    id: Date.now().toString(),
                    modeId,
                    modeName,
                    startTime: Date.now(),
                    endTime: null,
                    isActive: true,
                };

                set((state) => ({
                    currentSession: session,
                    sessions: [...state.sessions, session],
                }));
            },

            endSession: () => {
                const { currentSession, sessions } = get();
                if (!currentSession) return;

                const endedSession: FocusSession = {
                    ...currentSession,
                    endTime: Date.now(),
                    isActive: false,
                };

                set({
                    currentSession: null,
                    sessions: sessions.map(s =>
                        s.id === endedSession.id ? endedSession : s
                    ),
                });
            },

            recordBlockedNotification: (packageName, appName) => {
                const { currentSession } = get();

                const notification: BlockedNotification = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    timestamp: Date.now(),
                    packageName,
                    appName,
                    modeId: currentSession?.modeId || null,
                    modeName: currentSession?.modeName || null,
                };

                set((state) => ({
                    blockedNotifications: [...state.blockedNotifications, notification],
                }));
            },

            getTodayBlockedCount: () => {
                const dayStart = startOfDay(new Date()).getTime();
                return (get().blockedNotifications || []).filter(n => n.timestamp >= dayStart).length;
            },

            getWeekBlockedCount: () => {
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
                return (get().blockedNotifications || []).filter(n => n.timestamp >= weekStart).length;
            },

            getTodayFocusMinutes: () => {
                const dayStart = startOfDay(new Date()).getTime();
                const { sessions = [], currentSession } = get();

                let totalMs = 0;

                // Completed sessions today
                sessions.forEach(s => {
                    if (s.endTime && s.startTime >= dayStart) {
                        totalMs += s.endTime - s.startTime;
                    } else if (s.endTime && s.endTime >= dayStart && s.startTime < dayStart) {
                        // Session started yesterday, ended today
                        totalMs += s.endTime - dayStart;
                    }
                });

                // Current active session
                if (currentSession && currentSession.startTime >= dayStart) {
                    totalMs += Date.now() - currentSession.startTime;
                } else if (currentSession && currentSession.startTime < dayStart) {
                    totalMs += Date.now() - dayStart;
                }

                return Math.floor(totalMs / (1000 * 60));
            },

            getWeekFocusMinutes: () => {
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
                const { sessions = [], currentSession } = get();

                let totalMs = 0;

                sessions.forEach(s => {
                    if (s.endTime && s.startTime >= weekStart) {
                        totalMs += s.endTime - s.startTime;
                    } else if (s.endTime && s.endTime >= weekStart && s.startTime < weekStart) {
                        totalMs += s.endTime - weekStart;
                    }
                });

                if (currentSession && currentSession.startTime >= weekStart) {
                    totalMs += Date.now() - currentSession.startTime;
                } else if (currentSession && currentSession.startTime < weekStart) {
                    totalMs += Date.now() - weekStart;
                }

                return Math.floor(totalMs / (1000 * 60));
            },

            getTopDistractingApps: (limit = 5) => {
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
                const notifications = (get().blockedNotifications || []).filter(n => n.timestamp >= weekStart);

                const countMap: Record<string, { appName: string; count: number }> = {};

                notifications.forEach(n => {
                    if (!countMap[n.packageName]) {
                        countMap[n.packageName] = { appName: n.appName, count: 0 };
                    }
                    countMap[n.packageName].count++;
                });

                return Object.entries(countMap)
                    .map(([packageName, data]) => ({
                        packageName,
                        appName: data.appName,
                        count: data.count,
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, limit);
            },

            getMostUsedMode: () => {
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
                const sessions = (get().sessions || []).filter(s => s.startTime >= weekStart);

                if (sessions.length === 0) return null;

                const countMap: Record<string, { modeName: string; count: number }> = {};

                sessions.forEach(s => {
                    if (!countMap[s.modeId]) {
                        countMap[s.modeId] = { modeName: s.modeName, count: 0 };
                    }
                    countMap[s.modeId].count++;
                });

                const sorted = Object.entries(countMap)
                    .map(([modeId, data]) => ({
                        modeId,
                        modeName: data.modeName,
                        count: data.count,
                    }))
                    .sort((a, b) => b.count - a.count);

                return sorted[0] || null;
            },

            cleanupOldData: () => {
                const thirtyDaysAgo = subDays(new Date(), 30).getTime();

                set((state) => ({
                    sessions: (state.sessions || []).filter(s => s.startTime >= thirtyDaysAgo),
                    blockedNotifications: (state.blockedNotifications || []).filter(n => n.timestamp >= thirtyDaysAgo),
                }));
            },
        }),
        {
            name: 'hush-focus-sessions',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

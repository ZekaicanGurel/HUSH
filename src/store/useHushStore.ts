import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { NativeNotificationService } from '../services/NativeNotificationService';
import { VirtualApp, VIRTUAL_APPS } from '../data/virtualApps';
import { addMinutes, format } from 'date-fns';

export interface NotificationLog {
    id: string;
    appId: string;
    appName: string;
    timestamp: number;
    status: 'muted' | 'delivered';
    reason?: string; // 'user-muted', 'focus-mode', 'important'
}

export interface FocusMode {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name string
    blockedAppIds: string[]; // List of package names to block when active
}

const DEFAULT_FOCUS_MODES: FocusMode[] = [
    { id: '1', name: 'Study', description: 'Blocks social media', icon: 'BookOpen', blockedAppIds: [] },
    { id: '2', name: 'Work', description: 'Allow only work apps', icon: 'Briefcase', blockedAppIds: [] },
    { id: '3', name: 'Sleep', description: 'Mute all except alarm', icon: 'Moon', blockedAppIds: [] },
    { id: '4', name: 'Deep Focus', description: 'Total silence', icon: 'Zap', blockedAppIds: [] },
];

// ... (interfaces moved up)

export interface Suggestion {
    id: string;
    type: 'mute_app' | 'activate_mode' | 'schedule_mode';
    title: string;
    description: string;
    data: any; // Context data (e.g. appId, modeId)
    isDismissed: boolean;
}

export interface FocusSchedule {
    id: string;
    modeId: string;
    days: number[]; // 0=Sunday, 1=Monday...
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    isActive: boolean;
}

interface HushState {
    // Persistence
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    hasOnboarded: boolean;
    setHasOnboarded: (status: boolean) => void;

    // App State
    apps: VirtualApp[];
    ensureAppExists: (packageName: string, appName: string) => void;
    toggleAppMute: (appId: string) => void; // Manual mute overrides
    refreshInstalledApps: () => Promise<void>;

    // Stats (Daily)
    stats: {
        mutedCount: number;
        deliveredCount: number;
        minutesSaved: number;
        lastResetDate: string; // YYYY-MM-DD to check for daily reset
    };

    // Logs & Analytics
    logs: NotificationLog[];
    addLog: (log: Omit<NotificationLog, 'id'>) => void;
    resetDailyStats: () => void;

    // Features
    isPremium: boolean;
    setPremium: (status: boolean) => void;

    // Focus Modes
    focusModes: FocusMode[];
    activeFocusModeId: string | null;
    setFocusMode: (id: string | null) => void;
    addFocusMode: (mode: Omit<FocusMode, 'id'>) => void;
    updateFocusMode: (mode: FocusMode) => void;
    removeFocusMode: (id: string) => void;

    // Feature: Smart Suggestions (Premium)
    suggestions: Suggestion[];
    generateSuggestions: () => void;
    dismissSuggestion: (id: string) => void;

    // Feature: Focus Goals & Streaks (Premium)
    dailyGoalMinutes: number;
    streak: { current: number; max: number; lastLogDate: string };
    setDailyGoal: (minutes: number) => void;
    updateStreak: () => void; // Check daily usage

    // Feature: Keyword Filtering (Premium)
    keywordFilters: string[];
    addKeywordFilter: (keyword: string) => void;
    removeKeywordFilter: (keyword: string) => void;

    // Feature: Focus Schedules (Premium)
    schedules: FocusSchedule[];
    addSchedule: (schedule: Omit<FocusSchedule, 'id'>) => void;
    removeSchedule: (id: string) => void;
    toggleSchedule: (id: string) => void;
}

export const useHushStore = create<HushState>()(
    persist(
        (set, get) => ({
            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),

            hasOnboarded: false,
            setHasOnboarded: (status) => set({ hasOnboarded: status }),

            apps: VIRTUAL_APPS,

            refreshInstalledApps: async () => {
                if (Platform.OS !== 'android') return;

                const nativeApps = await NativeNotificationService.getInstalledApps();
                if (nativeApps.length > 0) {
                    set((state) => {
                        // Filter out HUSH itself and system/expo stuff if needed
                        const filteredApps = nativeApps.filter(na =>
                            na.packageName !== 'com.zekaicann.hush' &&
                            na.packageName !== 'host.exp.exponent' // Expo Go
                        );

                        // Merge: Keep existing mute status if app exists, otherwise add new
                        const currentAppsMap = new Map(state.apps.map(a => [a.id, a]));
                        const newAppsList: VirtualApp[] = filteredApps.map(na => {
                            const existing = currentAppsMap.get(na.packageName);
                            return {
                                id: na.packageName,
                                name: na.appName,
                                category: existing ? existing.category : 'Other',
                                important: existing ? existing.important : false,
                                isMuted: existing ? existing.isMuted : false,
                                iconName: existing ? existing.iconName : 'Smartphone' // Default icon
                            };
                        });
                        // Sort: Muted first, then alphanumeric
                        newAppsList.sort((a, b) => {
                            if (a.isMuted !== b.isMuted) return a.isMuted ? -1 : 1;
                            return a.name.localeCompare(b.name);
                        });

                        // Update Default Focus Modes with Heuristics if they are empty
                        let updatedFocusModes = state.focusModes;
                        // Only run heuristic once or if empty (simplified check)
                        if (updatedFocusModes[0].blockedAppIds.length === 0) {
                            const socialApps = newAppsList.filter(a =>
                                a.id.includes('instagram') || a.id.includes('facebook') || a.id.includes('twitter') ||
                                a.id.includes('snapchat') || a.id.includes('tiktok') || a.id.includes('social')
                            ).map(a => a.id);

                            const gameApps = newAppsList.filter(a => a.id.includes('game') || a.id.includes('play')).map(a => a.id);

                            updatedFocusModes = updatedFocusModes.map(m => {
                                if (m.name === 'Study') return { ...m, blockedAppIds: [...socialApps, ...gameApps] };
                                if (m.name === 'Work') return { ...m, blockedAppIds: [...socialApps, ...gameApps] }; // Similar
                                if (m.name === 'Sleep') return { ...m, blockedAppIds: newAppsList.filter(a => !a.id.includes('clock') && !a.id.includes('alarm')).map(a => a.id) };
                                return m;
                            });
                        }

                        return { apps: newAppsList, focusModes: updatedFocusModes };
                    });
                }
            },

            // Helper to ensure app exists
            ensureAppExists: (packageName: string, appName: string) => set((state) => {
                const exists = state.apps.find(a => a.id === packageName);
                if (!exists) {
                    return {
                        apps: [...state.apps, {
                            id: packageName,
                            name: appName,
                            category: 'Other',
                            important: false,
                            isMuted: false,
                            iconName: 'Smartphone'
                        }]
                    };
                }
                return {};
            }),

            toggleAppMute: (appId) => set((state) => {
                const updatedApps = state.apps.map(app =>
                    app.id === appId && !app.important // Can't mute important apps
                        ? { ...app, isMuted: !app.isMuted }
                        : app
                );

                // Sync to Native (only on Android)
                if (Platform.OS === 'android') {
                    const blockedPackages = updatedApps.filter(a => a.isMuted).map(a => a.id);
                    NativeModules.HushModule.setBlockedApps(blockedPackages);
                }

                return { apps: updatedApps };
            }),

            stats: {
                mutedCount: 0,
                deliveredCount: 0,
                minutesSaved: 0,
                lastResetDate: format(new Date(), 'yyyy-MM-dd'),
            },

            logs: [],
            addLog: (log) => set((state) => {
                const today = format(new Date(), 'yyyy-MM-dd');

                // Check for daily reset
                let currentStats = state.stats;
                if (state.stats.lastResetDate !== today) {
                    currentStats = { mutedCount: 0, deliveredCount: 0, minutesSaved: 0, lastResetDate: today };
                }

                const newStats = {
                    ...currentStats,
                    mutedCount: log.status === 'muted' ? currentStats.mutedCount + 1 : currentStats.mutedCount,
                    deliveredCount: log.status === 'delivered' ? currentStats.deliveredCount + 1 : currentStats.deliveredCount,
                    minutesSaved: log.status === 'muted' ? currentStats.minutesSaved + 1.5 : currentStats.minutesSaved, // Assume 1.5 mins per distraction
                };

                return {
                    logs: [{ id: Date.now().toString(), ...log }, ...state.logs].slice(0, 1000), // Keep last 1000
                    stats: newStats
                };
            }),

            resetDailyStats: () => set({
                stats: { mutedCount: 0, deliveredCount: 0, minutesSaved: 0, lastResetDate: format(new Date(), 'yyyy-MM-dd') }
            }),

            isPremium: false, // Managed by RevenueCat, do not set manually
            setPremium: (status) => set({ isPremium: status }),

            focusModes: DEFAULT_FOCUS_MODES,
            activeFocusModeId: null,

            setFocusMode: (id) => set((state) => {
                const newActiveId = id;

                // SYNC TO NATIVE
                if (Platform.OS === 'android') {
                    // 1. Get Manual Muted Apps
                    const manualBlocked = state.apps.filter(a => a.isMuted).map(a => a.id);

                    // 2. Get Focus Mode Muted Apps
                    let focusBlocked: string[] = [];
                    if (newActiveId) {
                        const mode = state.focusModes.find(m => m.id === newActiveId);
                        if (mode) {
                            focusBlocked = mode.blockedAppIds;
                        }
                    }

                    // 3. Union
                    const allBlocked = Array.from(new Set([...manualBlocked, ...focusBlocked]));
                    NativeModules.HushModule.setBlockedApps(allBlocked);
                }

                return { activeFocusModeId: newActiveId };
            }),

            addFocusMode: (modeData) => set((state) => {
                const newMode: FocusMode = {
                    id: Date.now().toString(),
                    ...modeData
                };
                return { focusModes: [...state.focusModes, newMode] };
            }),

            updateFocusMode: (updatedMode) => set((state) => ({
                focusModes: state.focusModes.map(m => m.id === updatedMode.id ? updatedMode : m)
            })),

            removeFocusMode: (id) => set((state) => ({
                focusModes: state.focusModes.filter(m => m.id !== id),
                activeFocusModeId: state.activeFocusModeId === id ? null : state.activeFocusModeId
            })),

            // Feature: Smart Suggestions
            suggestions: [],
            generateSuggestions: () => set((state) => {
                // Basic logic: Find most muted apps and suggest "Deep Focus" mode
                // In production this would be smarter
                const mutedCounts: Record<string, number> = {};
                state.logs.forEach(log => {
                    if (log.status === 'muted') {
                        mutedCounts[log.appName] = (mutedCounts[log.appName] || 0) + 1;
                    }
                });

                // If top muted > 20 times today
                const topMuted = Object.entries(mutedCounts).sort((a, b) => b[1] - a[1])[0];
                if (topMuted && topMuted[1] > 20) {
                    const newSug: Suggestion = {
                        id: Date.now().toString(),
                        type: 'activate_mode',
                        title: 'High Distraction Detected',
                        description: `${topMuted[0]} has been muted ${topMuted[1]} times. Switch to Deep Focus?`,
                        data: { modeId: '4' },
                        isDismissed: false
                    };
                    // Avoid duplicates
                    if (!state.suggestions.some(s => s.title === newSug.title)) {
                        return { suggestions: [newSug, ...state.suggestions] };
                    }
                }
                return {};
            }),
            dismissSuggestion: (id) => set((state) => ({
                suggestions: state.suggestions.map(s => s.id === id ? { ...s, isDismissed: true } : s)
            })),

            // Feature: Goals & Streaks
            dailyGoalMinutes: 120, // 2 hours of focus intent
            streak: { current: 0, max: 0, lastLogDate: format(new Date(), 'yyyy-MM-dd') },
            setDailyGoal: (mins) => set({ dailyGoalMinutes: mins }),
            updateStreak: () => set((state) => {
                const today = format(new Date(), 'yyyy-MM-dd');
                if (state.streak.lastLogDate === today) return {}; // Already checked

                // Simple streak logic: If we saved > 30 mins yesterday, streak++
                // This logic needs yesterday check. For now, we assume user opens app daily.
                // If diff > 1 day, reset.
                return { streak: { ...state.streak, lastLogDate: today } };
            }),

            // Feature: Keywords
            keywordFilters: [],
            addKeywordFilter: (k) => set(s => ({ keywordFilters: [...s.keywordFilters, k] })),
            removeKeywordFilter: (k) => set(s => ({ keywordFilters: s.keywordFilters.filter(x => x !== k) })),

            // Feature: Schedules
            schedules: [],
            addSchedule: (s) => set(st => ({ schedules: [...st.schedules, { id: Date.now().toString(), ...s, isActive: true }] })),
            removeSchedule: (id) => set(st => ({ schedules: st.schedules.filter(s => s.id !== id) })),
            toggleSchedule: (id) => set(st => ({ schedules: st.schedules.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),

        }),
        {
            name: 'hush-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            partialize: (state) => ({
                apps: state.apps,
                stats: state.stats,
                logs: state.logs,
                isPremium: state.isPremium,
                activeFocusModeId: state.activeFocusModeId
            }), // Don't persist ephemeral stuff if any
        }
    )
);

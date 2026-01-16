import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { NativeNotificationService } from '../services/NativeNotificationService';
import { VirtualApp, VIRTUAL_APPS } from '../data/virtualApps';
import { addMinutes, format } from 'date-fns';
import {
    FocusModeRule,
    DEFAULT_FOCUS_MODE_RULES,
    computeBlockedApps,
    categorizeApp,
    AppCategory
} from '../data/focusModeRules';

export interface NotificationLog {
    id: string;
    appId: string;
    appName: string;
    timestamp: number;
    status: 'muted' | 'delivered';
    reason?: string;
}

// Re-export FocusModeRule for convenience
export type { FocusModeRule, AppCategory };

// User override type for manual app control
export type UserOverride = 'allow' | 'block';


export interface Suggestion {
    id: string;
    type: 'mute_app' | 'activate_mode' | 'schedule_mode';
    title: string;
    description: string;
    data: any; // Context data (e.g. appId, modeId)
    isDismissed: boolean;
}

// Schedule type matching the hook
export interface FocusModeSchedule {
    id: string;
    modeId: string;
    modeName: string;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    days: number[];    // 0=Sun, 1=Mon...
    enabled: boolean;
}

export { FocusModeSchedule as FocusSchedule }; // Alias for backward compatibility if needed

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

    // Focus Modes (Category-based rules)
    focusModes: FocusModeRule[];
    activeFocusModeId: string | null;
    setFocusMode: (id: string | null) => void;
    addFocusMode: (mode: Omit<FocusModeRule, 'id' | 'isDefault' | 'isCustom' | 'blockedApps' | 'allowedApps'>) => void;
    updateFocusMode: (mode: FocusModeRule) => void;
    removeFocusMode: (id: string) => void;

    // Scheduled Focus Modes
    focusSchedules: FocusModeSchedule[];
    addSchedule: (schedule: Omit<FocusModeSchedule, 'id'>) => void;
    updateSchedule: (schedule: FocusModeSchedule) => void;
    deleteSchedule: (id: string) => void;

    // User Overrides for Manage Apps
    userOverrides: Record<string, UserOverride>;
    setUserOverride: (packageName: string, override: UserOverride | null) => void;
    getEffectiveMuteStatus: (packageName: string) => { isMuted: boolean; reason: string };

    // Feature: Smart Suggestions (Premium)
    dismissedSuggestionIds: string[];
    smartSuggestionsEnabled: boolean;
    toggleSmartSuggestions: () => void;
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
    // Removed legacy schedules in favor of focusSchedules
    resetAllData: () => Promise<void>;
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

                        // Migration Logic: Switch to new category-based Focus Modes
                        let updatedFocusModes: FocusModeRule[];
                        const hasNewDefaultModes = state.focusModes.some(m => ['study', 'work', 'sleep', 'deep-focus'].includes(m.id));

                        if (!hasNewDefaultModes) {
                            // Migrate to new default modes with category rules
                            updatedFocusModes = [...DEFAULT_FOCUS_MODE_RULES];

                            // Keep any existing custom modes (not old defaults 1,2,3,4)
                            const customModes = state.focusModes
                                .filter(m => !['1', '2', '3', '4', 'study', 'work', 'sleep', 'deep-focus'].includes(m.id))
                                .map(m => ({
                                    ...m,
                                    isDefault: false,
                                    isCustom: true,
                                    blockedCategories: (m as any).blockedCategories || [],
                                    allowedCategories: (m as any).allowedCategories || [],
                                    blockedApps: (m as any).blockedApps || (m as any).blockedAppIds || [],
                                    allowedApps: (m as any).allowedApps || [],
                                }));

                            updatedFocusModes = [...updatedFocusModes, ...customModes] as FocusModeRule[];
                        } else {
                            // Already migrated, keep existing
                            updatedFocusModes = state.focusModes;
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

                // Focus Intelligence: Record blocked notification for stats
                if (log.status === 'muted') {
                    try {
                        const { recordBlockedNotification } = require('./focusSessionStore').useFocusSessionStore.getState();
                        const app = state.apps.find(a => a.id === log.appId);
                        recordBlockedNotification(log.appId, app?.name || 'Unknown App');
                    } catch (e) {
                        // Silently fail if focus session store isn't ready
                    }
                }

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

            focusModes: DEFAULT_FOCUS_MODE_RULES,
            activeFocusModeId: null,

            // User Overrides: Allows users to manually override Focus Mode rules
            userOverrides: {},

            setUserOverride: (packageName, override) => set((state) => {
                const newOverrides = { ...state.userOverrides };
                if (override === null) {
                    delete newOverrides[packageName];
                } else {
                    newOverrides[packageName] = override;
                }
                return { userOverrides: newOverrides };
            }),

            getEffectiveMuteStatus: (packageName) => {
                const state = get();
                const safeOverrides = state.userOverrides || {};

                // Check user override first (highest priority)
                if (safeOverrides[packageName] === 'allow') {
                    return { isMuted: false, reason: 'User allowed' };
                }
                if (safeOverrides[packageName] === 'block') {
                    return { isMuted: true, reason: 'User blocked' };
                }

                // Check active Focus Mode using category-based rules
                if (state.activeFocusModeId) {
                    const mode = state.focusModes.find(m => m.id === state.activeFocusModeId);
                    if (mode) {
                        const app = state.apps.find(a => a.id === packageName);
                        const appCategory = categorizeApp(packageName, app?.name);
                        const appsForCheck = [{ packageName, appName: app?.name || '', category: appCategory }];
                        const blocked = computeBlockedApps(appsForCheck, mode, safeOverrides);
                        if (blocked && blocked.includes(packageName)) {
                            return { isMuted: true, reason: `Muted by ${mode.name}` };
                        }
                    }
                }

                // Check manual app mute
                const app = state.apps.find(a => a.id === packageName);
                if (app?.isMuted) {
                    return { isMuted: true, reason: 'Manually muted' };
                }

                return { isMuted: false, reason: 'Allowed' };
            },

            setFocusMode: (id) => set((state) => {
                const newActiveId = id;
                const previousModeId = state.activeFocusModeId;

                // Track Focus Intelligence sessions
                const { startSession, endSession, currentSession } = require('./focusSessionStore').useFocusSessionStore.getState();

                // End previous session if any
                if (previousModeId && currentSession) {
                    endSession();
                }

                // Start new session if activating a mode
                if (newActiveId) {
                    const mode = state.focusModes.find(m => m.id === newActiveId);
                    if (mode) {
                        startSession(newActiveId, mode.name);
                    }
                }

                // SYNC TO NATIVE with category-based rules
                if (Platform.OS === 'android') {
                    let blockedApps: string[] = [];
                    const safeOverrides = state.userOverrides || {};

                    if (newActiveId) {
                        const mode = state.focusModes.find(m => m.id === newActiveId);
                        if (mode) {
                            // Get all apps with their categories
                            const appsWithCategories = state.apps.map(a => ({
                                packageName: a.id,
                                appName: a.name,
                                category: categorizeApp(a.id, a.name),
                            }));

                            // Compute blocked apps using category rules
                            blockedApps = computeBlockedApps(appsWithCategories, mode, safeOverrides) || [];
                        }
                    }

                    // Add any manually blocked apps that user explicitly blocked
                    const manualBlocked = state.apps.filter(a =>
                        a.isMuted || safeOverrides[a.id] === 'block'
                    ).map(a => a.id);

                    const allBlocked = Array.from(new Set([...blockedApps, ...manualBlocked]));
                    NativeModules.HushModule.setBlockedApps(allBlocked);

                    // Sync Widget State
                    if (NativeModules.HushModule.updateWidget) {
                        const mode = state.focusModes.find(m => m.id === newActiveId);
                        const statusText = newActiveId && mode ? mode.name : 'Focus Off';
                        NativeModules.HushModule.updateWidget(statusText, !!newActiveId);
                    }
                }

                return { activeFocusModeId: newActiveId };
            }),

            addFocusMode: (modeData) => set((state) => {
                // Count existing custom modes
                const customModeCount = state.focusModes.filter(m => m.isCustom).length;

                // Free users can create 1 custom mode
                if (!state.isPremium && customModeCount >= 1) {
                    console.warn('[HushStore] addFocusMode blocked: Free limit reached (1 custom mode)');
                    return {};
                }

                const newMode: FocusModeRule = {
                    id: Date.now().toString(),
                    isDefault: false,
                    isCustom: true,
                    blockedApps: [],
                    allowedApps: [],
                    blockedCategories: [],
                    allowedCategories: [],
                    ...modeData
                };
                return { focusModes: [...state.focusModes, newMode] };
            }),

            updateFocusMode: (updatedMode) => set((state) => ({
                focusModes: state.focusModes.map(m =>
                    m.id === updatedMode.id ? updatedMode : m
                )
            })),

            removeFocusMode: (id) => set((state) => {
                const mode = state.focusModes.find(m => m.id === id);
                if (!mode) return {};

                if (mode.isDefault) {
                    console.warn('[HushStore] removeFocusMode blocked: Cannot delete default modes');
                    return {};
                }

                return {
                    focusModes: state.focusModes.filter(m => m.id !== id),
                    activeFocusModeId: state.activeFocusModeId === id ? null : state.activeFocusModeId
                };
            }),

            // --- Scheduled Focus Modes ---
            focusSchedules: [],

            addSchedule: (scheduleData) => set((state) => {
                // Free users limit: 1 schedule (Premium: unlimited)
                if (!state.isPremium && state.focusSchedules.length >= 1) {
                    console.warn('[HushStore] addSchedule blocked: Free limit reached');
                    return {};
                }

                const newSchedule: FocusModeSchedule = {
                    id: Date.now().toString(),
                    ...scheduleData
                };
                return { focusSchedules: [...state.focusSchedules, newSchedule] };
            }),

            updateSchedule: (updatedSchedule) => set((state) => ({
                focusSchedules: state.focusSchedules.map(s =>
                    s.id === updatedSchedule.id ? updatedSchedule : s
                )
            })),

            deleteSchedule: (id) => set((state) => ({
                focusSchedules: state.focusSchedules.filter(s => s.id !== id)
            })),

            // Feature: Smart Suggestions
            // Feature: Smart Suggestions
            // Feature: Smart Suggestions
            dismissedSuggestionIds: [],
            smartSuggestionsEnabled: true,
            toggleSmartSuggestions: () => set(state => ({ smartSuggestionsEnabled: !state.smartSuggestionsEnabled })),
            dismissSuggestion: (id) => set((state) => ({
                dismissedSuggestionIds: [...state.dismissedSuggestionIds, id]
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

            resetAllData: async () => {
                const state = get();
                // 1. Cancel Native Alarms & Widget
                if (Platform.OS === 'android') {
                    state.focusSchedules.forEach(s => {
                        if (NativeModules.HushModule?.cancelAlarm) {
                            NativeModules.HushModule.cancelAlarm(s.id);
                        }
                    });
                    if (NativeModules.HushModule?.setBlockedApps) {
                        NativeModules.HushModule.setBlockedApps([]);
                    }
                    if (NativeModules.HushModule?.updateWidget) {
                        NativeModules.HushModule.updateWidget('Focus Off', false);
                    }
                }

                // 2. Clear Persistence
                await AsyncStorage.clear();

                // 3. Reset State
                set({
                    hasOnboarded: false,
                    apps: VIRTUAL_APPS,
                    stats: { mutedCount: 0, deliveredCount: 0, minutesSaved: 0, lastResetDate: format(new Date(), 'yyyy-MM-dd') },
                    logs: [],
                    focusModes: DEFAULT_FOCUS_MODE_RULES,
                    activeFocusModeId: null,
                    focusSchedules: [],
                    userOverrides: {},
                    dismissedSuggestionIds: [],
                    streak: { current: 0, max: 0, lastLogDate: format(new Date(), 'yyyy-MM-dd') },
                    dailyGoalMinutes: 120,
                    keywordFilters: [],
                    isPremium: false
                });
            },

            // Feature: Schedules - Removed legacy


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
                activeFocusModeId: state.activeFocusModeId,
                focusModes: state.focusModes,
                focusSchedules: state.focusSchedules,
                userOverrides: state.userOverrides,
                dismissedSuggestionIds: state.dismissedSuggestionIds,
                smartSuggestionsEnabled: state.smartSuggestionsEnabled,
                streak: state.streak,
                dailyGoalMinutes: state.dailyGoalMinutes,
                keywordFilters: state.keywordFilters
            }), // Don't persist ephemeral stuff if any
        }
    )
);

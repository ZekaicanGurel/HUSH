/**
 * Focus Mode Scheduler Hook
 * 
 * Manages scheduled auto-activation of Focus Modes using AlarmManager.
 * Provides functions to create, update, delete schedules and check active schedules.
 */

import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useHushStore } from '../store/useHushStore';

const { HushModule } = NativeModules;

export interface FocusModeSchedule {
    id: string;
    modeId: string;
    modeName: string;
    startTime: string; // "21:00" format (HH:mm)
    endTime: string;   // "23:00" format (HH:mm)
    days: number[];    // [1,2,3,4,5] = Mon-Fri (1=Mon, 7=Sun)
    enabled: boolean;
}

// Parse "HH:mm" to { hour, minute }
const parseTime = (timeStr: string): { hour: number; minute: number } => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
};

// Get next occurrence of this schedule
const getNextOccurrence = (schedule: FocusModeSchedule, isStart: boolean): Date | null => {
    if (!schedule.enabled || schedule.days.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // Sunday = 7
    const { hour, minute } = parseTime(isStart ? schedule.startTime : schedule.endTime);

    // Find next matching day
    for (let i = 0; i < 7; i++) {
        const targetDay = ((currentDay - 1 + i) % 7) + 1;
        if (!schedule.days.includes(targetDay)) continue;

        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + i);
        targetDate.setHours(hour, minute, 0, 0);

        // If same day, check if time hasn't passed
        if (i === 0 && targetDate <= now) continue;

        return targetDate;
    }

    return null;
};

export const useFocusScheduler = () => {
    const schedules = useHushStore(state => state.focusSchedules);
    const setFocusMode = useHushStore(state => state.setFocusMode);

    // Check if we should activate/deactivate a mode (runs every minute)
    useEffect(() => {
        const checkSchedules = () => {
            const now = new Date();
            const currentDay = now.getDay() === 0 ? 7 : now.getDay();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            schedules.forEach(schedule => {
                if (!schedule.enabled) return;
                if (!schedule.days.includes(currentDay)) return;

                // Check if current time matches start time
                if (currentTime === schedule.startTime) {
                    console.log(`[Scheduler] Activating ${schedule.modeName} at ${schedule.startTime}`);
                    setFocusMode(schedule.modeId);
                }

                // Check if current time matches end time
                if (currentTime === schedule.endTime) {
                    console.log(`[Scheduler] Deactivating ${schedule.modeName} at ${schedule.endTime}`);
                    setFocusMode(null);
                }
            });
        };

        // Run immediately and then every minute
        checkSchedules();
        const interval = setInterval(checkSchedules, 60000);

        return () => clearInterval(interval);
    }, [schedules, setFocusMode]);

    // Register alarms for each schedule (Android only)
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        schedules.forEach(schedule => {
            if (!schedule.enabled) return;

            const startOccurrence = getNextOccurrence(schedule, true);
            const endOccurrence = getNextOccurrence(schedule, false);

            if (startOccurrence && HushModule.scheduleAlarm) {
                HushModule.scheduleAlarm(
                    `focus_start_${schedule.id}`,
                    startOccurrence.getTime(),
                    JSON.stringify({ type: 'focus_start', modeId: schedule.modeId })
                );
            }

            if (endOccurrence && HushModule.scheduleAlarm) {
                HushModule.scheduleAlarm(
                    `focus_end_${schedule.id}`,
                    endOccurrence.getTime(),
                    JSON.stringify({ type: 'focus_end', modeId: schedule.modeId })
                );
            }
        });

        return () => {
            // Cancel all alarms on unmount (optional - keeps running in background)
            schedules.forEach(schedule => {
                if (HushModule.cancelAlarm) {
                    HushModule.cancelAlarm(`focus_start_${schedule.id}`);
                    HushModule.cancelAlarm(`focus_end_${schedule.id}`);
                }
            });
        };
    }, [schedules]);

    return {
        schedules,
    };
};

// Helper to format days for display
export const formatScheduleDays = (days: number[]): string => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekends';

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(d => dayNames[d - 1]).join(', ');
};

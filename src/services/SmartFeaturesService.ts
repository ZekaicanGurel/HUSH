import { useHushStore } from '../store/useHushStore';
import { format, subHours } from 'date-fns';

export interface SmartSuggestion {
    id: string;
    appId: string;
    appName: string;
    type: 'mute-suggestion';
    reason: string;
    timestamp: number;
}

export const generateSmartSuggestions = () => {
    const store = useHushStore.getState();
    const logs = store.logs;
    const cutoff = subHours(Date.now(), 24).getTime();

    // Filter logs for the last 24 hours
    const recentLogs = logs.filter(log => log.timestamp > cutoff);

    // Group by app and delivered status
    const deliveryCounts: Record<string, number> = {};

    recentLogs.forEach(log => {
        if (log.status === 'delivered') {
            deliveryCounts[log.appId] = (deliveryCounts[log.appId] || 0) + 1;
        }
    });

    const newSuggestions: SmartSuggestion[] = [];

    // Analyze: If > 3 delivered notifications for a non-important app, suggest muting
    Object.entries(deliveryCounts).forEach(([appId, count]) => {
        const app = store.apps.find(a => a.id === appId);
        if (app && !app.important && !app.isMuted && count >= 3) {
            // Check if suggestion already exists to avoid duplicates
            const exists = store.suggestions.some(s => s.appId === appId && s.type === 'mute-suggestion');
            if (!exists) {
                newSuggestions.push({
                    id: Date.now().toString() + appId,
                    appId,
                    appName: app.name,
                    type: 'mute-suggestion',
                    reason: `You've received ${count} notifications today but haven't opened them.`, // Mock logic: assume not opened
                    timestamp: Date.now()
                });
            }
        }
    });

    // Update store (we need to add a setSuggestions action to store first, let's assume we add it or just modify directly via setState if exposed, but proper way is action)
    // For now, let's just return them, and the caller (Simulation Service or UI) can update the store.
    // actually, let's update the store definition in the next step to handle this.

    return newSuggestions;
};

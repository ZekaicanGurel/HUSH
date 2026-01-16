import { useEffect, useState, useCallback, useRef } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SmartAppScanner } = NativeModules;

// Create event emitter for SmartAppScanner
const smartAppEmitter = Platform.OS === 'android' && SmartAppScanner
    ? new NativeEventEmitter(SmartAppScanner)
    : null;

export interface SmartAppInfo {
    packageName: string;
    appName: string;
    iconBase64: string;
    isSystemApp: boolean;
    isFromPlayStore: boolean;
    category: 'Social' | 'Finance' | 'Work' | 'System Important' | 'Other';
}

export interface GroupedApps {
    Social: SmartAppInfo[];
    Finance: SmartAppInfo[];
    Work: SmartAppInfo[];
    'System Important': SmartAppInfo[];
    Other: SmartAppInfo[];
}

export const useSmartApps = () => {
    const [apps, setApps] = useState<SmartAppInfo[]>([]);
    const [groupedApps, setGroupedApps] = useState<GroupedApps>({
        Social: [],
        Finance: [],
        Work: [],
        'System Important': [],
        Other: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track if component is mounted to prevent memory leaks
    const isMounted = useRef(true);

    const loadApps = useCallback(async () => {
        if (Platform.OS !== 'android') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await SmartAppScanner.getRelevantApps();

            // Check if still mounted before updating state
            if (!isMounted.current) return;

            // Sort alphabetically within each category
            const sortedApps = (result as SmartAppInfo[]).sort((a, b) =>
                a.appName.localeCompare(b.appName)
            );

            setApps(sortedApps);

            // Group apps by category
            const grouped: GroupedApps = {
                Social: [],
                Finance: [],
                Work: [],
                'System Important': [],
                Other: [],
            };

            for (const app of sortedApps) {
                const category = app.category as keyof GroupedApps;
                if (grouped[category]) {
                    grouped[category].push(app);
                } else {
                    grouped.Other.push(app);
                }
            }

            setGroupedApps(grouped);
        } catch (e: any) {
            if (!isMounted.current) return;
            console.error('Error loading smart apps:', e);
            setError(e.message || 'Failed to load apps');
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;

        // Initial load
        loadApps();

        // Subscribe to real-time app change events
        let subscription: any = null;

        if (smartAppEmitter) {
            subscription = smartAppEmitter.addListener('SmartAppsChanged', () => {
                console.log('[useSmartApps] Received SmartAppsChanged event, refreshing...');
                loadApps();
            });
        }

        // Cleanup
        return () => {
            isMounted.current = false;
            if (subscription) {
                subscription.remove();
            }
        };
    }, [loadApps]);

    return {
        apps,
        groupedApps,
        loading,
        error,
        refresh: loadApps,
    };
};

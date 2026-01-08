import { NativeModules, NativeEventEmitter, Platform, Linking } from 'react-native';
import { useHushStore } from '../store/useHushStore';

const { HushModule } = NativeModules;
const eventEmitter = Platform.OS === 'android' ? new NativeEventEmitter(HushModule) : null;

export const NativeNotificationService = {

    // Initialize Listener
    init: () => {
        if (Platform.OS === 'android') {
            console.log('Initializing Native Notification Listener...');

            // Check permissions
            NativeNotificationService.checkPermission().then(hasPermission => {
                if (!hasPermission) {
                    console.log('Notification permission missing.');
                    // We'll trust the UI to prompt for this
                } else {
                    console.log('Notification permission granted. Listening...');
                }
            });

            // Listen for events
            eventEmitter?.addListener('onNotificationReceived', (event) => {
                console.log('[Native] Notification Received:', event);
                NativeNotificationService.handleIncomingNotification(event);
            });
        } else {
            console.log('iOS: Running in Limited Mode (Manual/Focus Guide).');
        }
    },

    // Check Permission
    checkPermission: async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            return await HushModule.isNotificationAccessGranted();
        }
        return true; // iOS doesn't need this specfic permission in the same way for our goal
    },

    // Open Settings
    openSettings: () => {
        if (Platform.OS === 'android') {
            HushModule.openNotificationAccessSettings();
        } else {
            Linking.openSettings();
        }
    },

    // Get Installed Apps
    getInstalledApps: async (): Promise<any[]> => {
        if (Platform.OS === 'android') {
            try {
                const apps = await HushModule.getInstalledApps();
                return apps;
            } catch (e) {
                console.error('Failed to get apps', e);
                return [];
            }
        }
        return []; // Return empty or mock for iOS
    },

    // Handle Logic
    handleIncomingNotification: (event: any) => {
        const store = useHushStore.getState();
        const { packageName, title, timestamp, wasBlocked } = event;

        // Map package name to app name
        let appName = title || packageName;
        if (packageName.includes('instagram')) appName = 'Instagram';
        if (packageName.includes('whatsapp')) appName = 'WhatsApp';
        if (packageName.includes('twitter') || packageName.includes('x')) appName = 'X';
        if (packageName.includes('youtube')) appName = 'YouTube';

        store.ensureAppExists(packageName, appName);

        store.addLog({
            appId: packageName,
            appName: appName,
            timestamp: timestamp || Date.now(),
            status: wasBlocked ? 'muted' : 'delivered',
            reason: wasBlocked ? 'user-muted' : 'native-event'
        });
    }
};

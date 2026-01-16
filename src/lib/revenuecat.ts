import Purchases, {
    LOG_LEVEL,
    PurchasesPackage,
    CustomerInfo,
    PurchasesEntitlementInfo
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Keys provided by user
const API_KEYS = {
    ios: 'appl_placeholder_key', // User only provided Android key, placeholder for iOS
    android: 'test_RbFXWXamypUoFXvPajExsieVNpN'
};

export const ENTITLEMENT_ID = 'HUSH Premium';

export const initRevenueCat = async () => {
    try {
        // CRITICAL: Set log handler BEFORE configure() to fix "customLogHandler is not a function" error
        // This is a workaround for a known react-native-purchases issue
        Purchases.setLogHandler((logLevel, message) => {
            if (__DEV__) {
                console.log(`[RevenueCat] ${message}`);
            }
        });

        // Set log level based on environment
        if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        } else {
            Purchases.setLogLevel(LOG_LEVEL.ERROR);
        }

        // Configure the SDK
        if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: API_KEYS.android });
        } else {
            Purchases.configure({ apiKey: API_KEYS.ios });
        }
    } catch (e) {
        console.warn('[RevenueCat] Init error:', e);
    }
};

export const checkPremiumEntitlement = (customerInfo: CustomerInfo): boolean => {
    if (!customerInfo || !customerInfo.entitlements.active) return false;
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
};

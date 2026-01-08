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
    if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: API_KEYS.android });
    } else {
        Purchases.configure({ apiKey: API_KEYS.ios });
    }

    if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Identify user if you have a user system, otherwise anonymous
    // await Purchases.logIn(userId); 
};

export const checkPremiumEntitlement = (customerInfo: CustomerInfo): boolean => {
    if (!customerInfo || !customerInfo.entitlements.active) return false;
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
};

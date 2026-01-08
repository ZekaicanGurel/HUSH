import { useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { useHushStore } from '../store/useHushStore';
import { checkPremiumEntitlement, initRevenueCat } from '../lib/revenuecat';
import { Alert, Platform } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export const useRevenueCat = () => {
    const [isReady, setIsReady] = useState(false);
    const setPremium = useHushStore(state => state.setPremium);

    // Initialize RevenueCat
    useEffect(() => {
        const init = async () => {
            try {
                await initRevenueCat();

                // Set Initial Info
                const info = await Purchases.getCustomerInfo();
                handleCustomerInfoUpdate(info);

                setIsReady(true);
            } catch (e) {
                console.error("RevenueCat Init Error:", e);
            }
        };

        const handleCustomerInfoUpdate = (info: CustomerInfo) => {
            const isPremium = checkPremiumEntitlement(info);
            // Sync to Store (for global access without hooks if needed, though hook prefered)
            setPremium(isPremium);
        };

        init();

        // Listen for updates
        const listenerPromise = Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

        return () => {
            // Cleanup if needed (listener removes itself on unmount usually handled by SDK but good to know)
            // Newer SDKs might return a subscription object
        };
    }, []);

    // Core Methods
    const restorePurchases = useCallback(async () => {
        try {
            const info = await Purchases.restorePurchases();
            const isActive = checkPremiumEntitlement(info);
            if (isActive) {
                Alert.alert("Success", "Your purchases have been restored.");
            } else {
                Alert.alert("Notice", "No active subscriptions found to restore.");
            }
            return info;
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    }, []);

    const showPaywall = useCallback(async () => {
        try {
            // Using the RevenueCat UI Paywall
            const paywallResult = await RevenueCatUI.presentPaywall({
                displayCloseButton: true,
            });

            // Note: The UI SDK handles the purchase flow internally.
            // We just verify the state after it closes if needed, 
            // but the listener above should catch the update automatically.

            return paywallResult;
        } catch (e: any) {
            console.log("Paywall Error or Close:", e);
        }
    }, []);

    const showCustomerCenter = useCallback(async () => {
        if (Platform.OS === "android") {
            // Needed until CustomerCenter is fully stable on all React Native versions?
            // Actually presentCustomerCenter is available in react-native-purchases-ui
            try {
                // presentCustomerCenter might likely be 'presentCustomerCenter' or similar
                // Checking types... if not available, we fallback to manageSubscription
                await RevenueCatUI.presentCustomerCenter();
            } catch (e) {
                console.warn("Customer Center Error:", e);
            }
        } else {
            // iOS
            try {
                await RevenueCatUI.presentCustomerCenter();
            } catch (e) {
                console.warn("Customer Center Error:", e);
            }
        }
    }, []);

    return {
        isReady,
        restorePurchases,
        showPaywall,
        showCustomerCenter
    };
};

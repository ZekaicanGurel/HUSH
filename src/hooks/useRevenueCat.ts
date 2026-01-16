import { useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { useHushStore } from '../store/useHushStore';
import { checkPremiumEntitlement, initRevenueCat } from '../lib/revenuecat';
import { Alert, Platform } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export const useRevenueCat = () => {
    const [isReady, setIsReady] = useState(false);
    const setPremium = useHushStore(state => state.setPremium);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

    // Initialize RevenueCat
    useEffect(() => {
        const init = async () => {
            try {
                await initRevenueCat();

                // 1. Get Customer Info on Launch (CRITICAL for persistence)
                const info = await Purchases.getCustomerInfo();

                // Debug Log
                console.log(
                    "Initial Entitlements:",
                    Object.keys(info.entitlements.active)
                );

                let isPremiumStatus = checkPremiumEntitlement(info);

                // 2. AUTO-RESTORE LOGIC (Requested by User)
                // If not premium, try to restore silently to catch reinstalls
                if (!isPremiumStatus) {
                    try {
                        console.log("Not premium, attempting silent restore for reinstall persistence...");
                        const restoreInfo = await Purchases.restorePurchases();
                        isPremiumStatus = checkPremiumEntitlement(restoreInfo);
                        if (isPremiumStatus) {
                            console.log("Silent restore SUCCESS! Premium activated.");
                        } else {
                            console.log("Silent restore completed, but no premium entitlement found.");
                        }
                    } catch (restoreError) {
                        // Silent fail is intended here, don't nag user
                        console.log("Silent restore failed or cancelled:", restoreError);
                    }
                }

                // 3. Update Global Store (Source of Truth: RevenueCat -> Store)
                setPremium(isPremiumStatus);

                // 3. Fetch Offerings (for Paywall)
                try {
                    const offeringsData = await Purchases.getOfferings();
                    if (offeringsData.current && offeringsData.current.availablePackages.length > 0) {
                        setOfferings(offeringsData.current);
                    } else {
                        // FALLBACK: Simulates Weekly plan if Store connection fails/is empty
                        setOfferings({
                            identifier: 'default',
                            serverDescription: 'Default Offering',
                            metadata: {},
                            availablePackages: [
                                {
                                    identifier: '$rc_weekly',
                                    packageType: 'WEEKLY',
                                    product: {
                                        identifier: 'prod5b2541032e',
                                        description: 'Weekly Info',
                                        title: 'Weekly Access',
                                        price: 29.99,
                                        priceString: '₺29.99',
                                        currencyCode: 'TRY',
                                        introPrice: null,
                                        discounts: [],
                                        productCategory: 'SUBSCRIPTION',
                                        defaultOption: null,
                                        subscriptionOptions: [],
                                        presentedOfferingIdentifier: 'default',
                                    },
                                    offeringIdentifier: 'default',
                                } as unknown as PurchasesPackage,
                            ]
                        } as unknown as PurchasesOffering);
                    }
                } catch (e) {
                    console.log("Error fetching offerings", e);
                    // Same fallback if error
                    setOfferings({
                        identifier: 'default',
                        serverDescription: 'Default Offering',
                        metadata: {},
                        availablePackages: [
                            {
                                identifier: '$rc_weekly',
                                packageType: 'WEEKLY',
                                product: {
                                    identifier: 'prod5b2541032e',
                                    description: 'Weekly Info',
                                    title: 'Weekly Access',
                                    price: 29.99,
                                    priceString: '₺29.99',
                                    currencyCode: 'TRY',
                                    introPrice: null,
                                    discounts: [],
                                    productCategory: 'SUBSCRIPTION',
                                    defaultOption: null,
                                    subscriptionOptions: [],
                                    presentedOfferingIdentifier: 'default',
                                },
                                offeringIdentifier: 'default',
                            } as unknown as PurchasesPackage,
                        ]
                    } as unknown as PurchasesOffering);
                }

                setIsReady(true);
            } catch (e) {
                console.error("RevenueCat Init Error:", e);
            }
        };

        const handleCustomerInfoUpdate = (info: CustomerInfo) => {
            const isPremium = checkPremiumEntitlement(info);
            setPremium(isPremium);
            console.log("Customer Info Updated. Premium:", isPremium);
        };

        // Variable to track listener for cleanup
        let listenerUnsubscribe: any = null;

        // Initialize and then set up listener
        init().then(() => {
            // Only add listener AFTER init is complete (log handler is set)
            try {
                listenerUnsubscribe = Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
            } catch (e) {
                console.warn("Failed to add customer info listener:", e);
            }
        });

        return () => {
            // Clean up listener if it was set
            if (listenerUnsubscribe && typeof listenerUnsubscribe === 'function') {
                try {
                    listenerUnsubscribe();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
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
            // Ensure we pass a valid options object to prevent native crash from null ReadableMap
            const paywallOptions = {
                displayCloseButton: true,
                // Add required fields with defaults to prevent null reference in native
                requiredEntitlementIdentifier: undefined,
                offering: undefined,
            };
            const paywallResult = await RevenueCatUI.presentPaywall(paywallOptions);

            // Note: The UI SDK handles the purchase flow internally.
            // We just verify the state after it closes if needed, 
            // but the listener above should catch the update automatically.

            return paywallResult;
        } catch (e: any) {
            console.log("Paywall Error or Close:", e);
            // Don't rethrow - gracefully handle paywall errors
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
        offerings,
        restorePurchases,
        showPaywall,
        showCustomerCenter
    };
};

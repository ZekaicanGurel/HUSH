import React, { useEffect } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { TabNavigator } from './TabNavigator';
import { PremiumScreen } from '../screens/PremiumScreen';
import { FocusEditorScreen } from '../screens/FocusEditorScreen';
import { SchedulesScreen } from '../screens/SchedulesScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { colors } from '../theme/colors';
import { useHushStore } from '../store/useHushStore';

import { useRevenueCat } from '../hooks/useRevenueCat';

const Stack = createStackNavigator();

export const RootNavigator = () => {
    // Initialize RevenueCat Listener Globally
    useRevenueCat();

    // Check for Widget Launch Action
    useEffect(() => {
        const checkWidgetAction = async () => {
            if (Platform.OS === 'android' && NativeModules.HushModule?.getInitialAction) {
                const action = await NativeModules.HushModule.getInitialAction();
                if (action === 'toggle_focus') {
                    const state = useHushStore.getState();
                    if (state.activeFocusModeId) {
                        state.setFocusMode(null);
                    } else {
                        // Start first mode (usually Deep Focus)
                        const firstMode = state.focusModes[0];
                        if (firstMode) state.setFocusMode(firstMode.id);
                    }
                }
            }
        };

        checkWidgetAction();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkWidgetAction();
            }
        });

        return () => subscription.remove();
    }, []);

    return (
        <NavigationContainer theme={{
            dark: true,
            colors: {
                primary: colors.primary,
                background: colors.background,
                card: colors.surface,
                text: colors.text.primary,
                border: colors.border,
                notification: colors.accent,
            },
            fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '900' },
            }
        }}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: colors.background },
                }}
                initialRouteName="Splash" // Start with Splash
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Premium" component={PremiumScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="FocusEditor" component={FocusEditorScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="Schedules" component={SchedulesScreen} />
                <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ presentation: 'modal' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

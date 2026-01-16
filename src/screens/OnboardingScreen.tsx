import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { Bell, Brain, Shield } from 'lucide-react-native';
import { layout } from '../theme/layout';
import { useHushStore } from '../store/useHushStore';
import { useI18nStore } from '../i18n';

const { width } = Dimensions.get('window');

export const OnboardingScreen = ({ navigation }: any) => {
    const { t } = useI18nStore();

    const SLIDES = [
        {
            id: 1,
            icon: Bell,
            title: t('onboarding_slide1_title'),
            text: t('onboarding_slide1_text'),
        },
        {
            id: 2,
            icon: Brain,
            title: t('onboarding_slide2_title'),
            text: t('onboarding_slide2_text'),
        },
        {
            id: 3,
            icon: Shield,
            title: t('onboarding_slide3_title'),
            text: t('onboarding_slide3_text'),
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const setHasOnboarded = useHushStore(state => state.setHasOnboarded);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / width);
        if (slide !== currentIndex) {
            setCurrentIndex(slide);
        }
    };

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            // FINISH ONBOARDING & REQUEST PERMISSION
            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                // Only ask if not already granted
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus === 'granted') {
                    console.log('Notification permission granted!');
                    // Persist Flags
                    await AsyncStorage.setItem('notificationPermissionAsked', 'true');
                    await AsyncStorage.setItem('hasSeenOnboarding', 'true');

                    // Update Store
                    setHasOnboarded(true);
                    navigation.replace('Main');
                } else {
                    // Permission denied, guide user to settings
                    Alert.alert(
                        'Permission Required',
                        'HUSH needs notifications to help you stay focused. Please enable them in settings.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Open Settings',
                                onPress: () => Linking.openSettings()
                            }
                        ]
                    );
                    // Do not navigate to Main if permission is denied and alert is shown.
                    // User stays on onboarding until they grant permission or explicitly cancel.
                }

            } catch (error) {
                console.log('Error requesting notification permission:', error);
                // Fallback: Ensure user still enters app even if permission logic fails
                await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                setHasOnboarded(true);
                navigation.replace('Main');
            }
        }
    };

    return (
        <ScreenWrapper>
            <View style={{ flex: 1 }}>
                <FlatList
                    ref={flatListRef}
                    data={SLIDES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        const Icon = item.icon;
                        return (
                            <View style={styles.slide}>
                                <View style={styles.iconContainer}>
                                    <Icon size={64} color={colors.primary} />
                                </View>
                                <ThemedText variant="header" center style={{ marginTop: 32, marginBottom: 16 }}>
                                    {item.title}
                                </ThemedText>
                                <ThemedText variant="body" center style={{ maxWidth: '80%' }}>
                                    {item.text}
                                </ThemedText>
                            </View>
                        );
                    }}
                />

                <View style={styles.footer}>
                    {/* Dot Indicators */}
                    <View style={styles.dotsContainer}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentIndex ? styles.activeDot : styles.inactiveDot
                                ]}
                            />
                        ))}
                    </View>

                    <Button
                        title={currentIndex === SLIDES.length - 1 ? t('onboarding_enable') : t('onboarding_next')}
                        onPress={handleNext}
                        style={{ width: '100%' }}
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    slide: {
        width: width - (layout.screenPadding * 2), // Adjust for wrapper padding
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    footer: {
        paddingVertical: layout.spacing.xl,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: layout.spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: colors.primary,
        width: 24, // Elongated active dot
    },
    inactiveDot: {
        backgroundColor: colors.border,
    },
});

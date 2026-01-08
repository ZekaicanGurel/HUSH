import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { Bell, Brain, Shield } from 'lucide-react-native';
import { layout } from '../theme/layout';
import { useHushStore } from '../store/useHushStore';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: 1,
        icon: Bell,
        title: 'Less Noise',
        text: 'We silence what you ignore.',
    },
    {
        id: 2,
        icon: Brain,
        title: 'Smart Learning',
        text: 'HUSH learns what matters to you.',
    },
    {
        id: 3,
        icon: Shield,
        title: 'Always Safe',
        text: 'Banking and OTP alerts are never muted.',
    },
];

export const OnboardingScreen = ({ navigation }: any) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const setHasOnboarded = useHushStore(state => state.setHasOnboarded);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / width);
        if (slide !== currentIndex) {
            setCurrentIndex(slide);
        }
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            // Request permission logic would go here
            setHasOnboarded(true);
            navigation.replace('Main');
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
                        title={currentIndex === SLIDES.length - 1 ? "Enable Notification Access" : "Next"}
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

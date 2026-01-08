import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, withSequence, withDelay } from 'react-native-reanimated';
import { ThemedText } from '../components/ThemedText';
import { colors } from '../theme/colors';
import { useHushStore } from '../store/useHushStore';
import LinearGradient from 'react-native-linear-gradient';
import { Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation }: any) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const hasOnboarded = useHushStore(state => state.hasOnboarded);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 1000 });
        scale.value = withTiming(1, { duration: 1000 });

        const timeout = setTimeout(() => {
            const target = hasOnboarded ? 'Main' : 'Onboarding';
            navigation.replace(target);
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0B0D10', '#151920']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.content, animatedStyle]}>
                <View style={styles.iconContainer}>
                    <Zap size={64} color={colors.primary} fill={colors.primary} />
                </View>
                <ThemedText variant="header" center style={styles.title}>HUSH</ThemedText>
            </Animated.View>

            <View style={styles.footer}>
                <ThemedText variant="caption" color={colors.text.tertiary} style={{ letterSpacing: 2 }}>FOCUS • SILENCE • CONTROL</ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 24,
        shadowColor: colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
    title: {
        fontSize: 48,
        letterSpacing: 8,
        fontWeight: '300',
        color: colors.text.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        opacity: 0.6,
    }
});

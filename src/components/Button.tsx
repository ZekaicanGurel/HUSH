import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { ThemedText } from './ThemedText';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style
}) => {

    const getBackgroundColor = () => {
        if (disabled) return colors.surface;
        if (variant === 'primary') return colors.primary;
        if (variant === 'secondary') return colors.surface;
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return colors.text.tertiary;
        if (variant === 'primary') return colors.background; // Dark text on neon
        if (variant === 'secondary') return colors.text.primary;
        return colors.text.secondary;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                variant === 'secondary' && styles.border,
                style
            ]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <ThemedText
                    variant="button"
                    style={{ color: getTextColor() }}
                >
                    {title}
                </ThemedText>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: layout.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    border: {
        borderWidth: 1,
        borderColor: colors.border,
    },
});

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20, // Requested 16-20 scale
        padding: layout.spacing.m,
        // Soft elevation (no hard borders)
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)', // Extremely subtle, just for definition

        // Android Elevation
        elevation: 4,

        // iOS Shadows
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2, // Softer shadow
        shadowRadius: 12, // More diffuse
    },
});

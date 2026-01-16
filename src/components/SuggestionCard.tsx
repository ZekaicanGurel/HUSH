import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors } from '../theme/colors';
import { Sparkles, X } from 'lucide-react-native';

interface SuggestionCardProps {
    title: string;
    description: string;
    onAction: () => void;
    onDismiss: () => void;
}

export const SuggestionCard = ({ title, description, onAction, onDismiss }: SuggestionCardProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconBg}>
                    <Sparkles size={16} color={colors.primary} />
                </View>
                <ThemedText variant="subheader" style={styles.title}>{title}</ThemedText>
                <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={18} color={colors.text.tertiary} />
                </TouchableOpacity>
            </View>

            <ThemedText variant="body" color={colors.text.secondary} style={styles.desc}>
                {description}
            </ThemedText>

            <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                <ThemedText style={styles.actionText}>Apply Suggestion</ThemedText>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBg: {
        backgroundColor: 'rgba(94, 234, 212, 0.1)', // Primary with opacity
        padding: 8,
        borderRadius: 10,
        marginRight: 10,
    },
    title: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 16,
        color: colors.text.primary,
    },
    desc: {
        marginBottom: 16,
        lineHeight: 22,
        fontSize: 14,
    },
    actionButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    actionText: {
        color: '#0F172A', // Slate 900
        fontWeight: 'bold',
        fontSize: 14,
    }
});

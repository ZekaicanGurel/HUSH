import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { colors } from '../theme/colors';
import { Crown, X, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface PremiumGateModalProps {
    visible: boolean;
    onClose: () => void;
    feature: 'create' | 'edit' | 'delete';
}

const FEATURE_MESSAGES = {
    create: {
        title: 'Create Custom Modes',
        description: 'Create smart notification modes that protect your focus.',
        benefit: 'Unlimited custom focus modes tailored to your lifestyle.',
    },
    edit: {
        title: 'Edit Focus Modes',
        description: 'Customize your modes to perfectly match your routine.',
        benefit: 'Fine-tune which apps are muted in each mode.',
    },
    delete: {
        title: 'Manage Your Modes',
        description: 'Full control over your focus experience.',
        benefit: 'Create, edit, and delete modes as your needs change.',
    },
};

export const PremiumGateModal: React.FC<PremiumGateModalProps> = ({
    visible,
    onClose,
    feature,
}) => {
    const navigation = useNavigation();
    const content = FEATURE_MESSAGES[feature];

    const handleUpgrade = () => {
        onClose();
        (navigation as any).navigate('Premium');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableWithoutFeedback>
                    <View style={styles.content}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={20} color={colors.text.tertiary} />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Crown size={32} color={colors.background} />
                        </View>

                        {/* Title */}
                        <ThemedText variant="header" center style={styles.title}>
                            {content.title}
                        </ThemedText>

                        {/* Description */}
                        <ThemedText variant="body" center color={colors.text.secondary} style={styles.description}>
                            {content.description}
                        </ThemedText>

                        {/* Benefit */}
                        <View style={styles.benefitRow}>
                            <Sparkles size={16} color={colors.primary} />
                            <ThemedText variant="caption" color={colors.text.secondary} style={styles.benefitText}>
                                {content.benefit}
                            </ThemedText>
                        </View>

                        {/* CTA */}
                        <Button
                            title="Unlock Premium"
                            onPress={handleUpgrade}
                            variant="primary"
                            style={styles.ctaButton}
                        />

                        {/* Dismiss */}
                        <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
                            <ThemedText variant="caption" color={colors.text.tertiary}>
                                Maybe later
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        marginBottom: 8,
    },
    description: {
        marginBottom: 20,
        lineHeight: 22,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(94, 234, 212, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    benefitText: {
        marginLeft: 8,
        flex: 1,
    },
    ctaButton: {
        width: '100%',
        marginBottom: 12,
    },
    dismissBtn: {
        padding: 8,
    },
});

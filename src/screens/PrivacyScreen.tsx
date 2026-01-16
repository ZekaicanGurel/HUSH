import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { colors } from '../theme/colors';
import { X, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useHushStore } from '../store/useHushStore';
import { Alert } from 'react-native';

export const PrivacyScreen = () => {
    const navigation = useNavigation();
    const resetAllData = useHushStore(state => state.resetAllData);

    const handleDeleteData = () => {
        Alert.alert(
            "Delete All Data?",
            "This action cannot be undone. All your stats, schedules, and preferences will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Data",
                    style: "destructive",
                    onPress: async () => {
                        await resetAllData();
                        Alert.alert("Data Deleted", "App has been reset.");
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Splash' }],
                        });
                    }
                }
            ]
        );
    };

    return (
        <ScreenWrapper style={{ paddingHorizontal: 0 }}>
            <View style={styles.header}>
                <ThemedText variant="header">Privacy Policy</ThemedText>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <ThemedText variant="body" style={styles.lastUpdated}>Last updated: January 10, 2026</ThemedText>

                <ThemedText variant="body" style={styles.intro}>
                    This Privacy Policy explains how HUSH ("we", "our", or "us") collects, uses, and protects your information when you use our mobile application HUSH (the "App").
                    {'\n'}{'\n'}
                    By using the App, you agree to the collection and use of information in accordance with this policy.
                </ThemedText>

                <Section title="1. Information We Collect">
                    <Bullet point="App Usage Data: We collect non-personal, aggregated data about how the App is used (e.g., features accessed, session duration)." />
                    <Bullet point="Notification Data: Data related to your notifications is processed locally on your device. We do not transmit content to external servers." />
                    <Bullet point="Subscription Status: We collect data regarding your subscription status through secure third-party providers (RevenueCat and Google Play)." />
                </Section>

                <Section title="2. Information We Do NOT Collect">
                    <Bullet point="No Personal Identification: We do not collect your name, address, phone number, or physical location." />
                    <Bullet point="No Private Content: We do not collect, read, or store your contacts, messages, photos, or other personal media." />
                    <Bullet point="No Data Selling: We do not sell your data to third parties." />
                </Section>

                <Section title="3. How Data Is Used">
                    <Bullet point="Functionality: To operate the App and deliver its core features." />
                    <Bullet point="Analytics: To understand user behavior and improve the App." />
                    <Bullet point="Premium Management: To verify and manage your premium subscription." />
                </Section>

                <Section title="4. Data Storage & Security">
                    <Bullet point="Local Processing: The majority of your data is processed and stored locally on your device." />
                    <Bullet point="Security Measures: We use industry-standard security measures." />
                    <Bullet point="Third-Party Transfer: Subscription-related data is transmitted securely to our payment providers." />
                </Section>

                <Section title="5. Third-Party Services">
                    <Bullet point="Google Play Services" />
                    <Bullet point="RevenueCat" />
                </Section>

                <Section title="6. User Rights">
                    <Bullet point="Uninstall: You may stop all collection of information by uninstalling the App." />
                    <Bullet point="Subscription Management: Manage via Google Play Store settings." />
                    <Bullet point="Data Removal: Contact support@hushapp.com" />
                </Section>

                <Section title="7. Children’s Privacy">
                    <ThemedText variant="body" color={colors.text.secondary}>
                        The App is not intended for use by children under the age of 13.
                    </ThemedText>
                </Section>

                <Section title="8. Contact Information">
                    <ThemedText variant="body" color={colors.text.secondary}>
                        Email: support@hushapp.com
                    </ThemedText>
                </Section>

                <Section title="Data Management">
                    <ThemedText variant="body" color={colors.text.secondary} style={{ marginBottom: 16 }}>
                        You have full control over your data. Deleting data will reset the app to its initial state, clearing all logs and schedules.
                    </ThemedText>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteData}
                    >
                        <Trash2 size={20} color={colors.status.error} style={{ marginRight: 8 }} />
                        <ThemedText style={{ color: colors.status.error, fontWeight: 'bold' }}>Delete All Data</ThemedText>
                    </TouchableOpacity>
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenWrapper>
    );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
        <ThemedText variant="title" style={styles.sectionTitle}>{title}</ThemedText>
        {children}
    </View>
);

const Bullet = ({ point }: { point: string }) => (
    <View style={styles.bulletItem}>
        <View style={styles.bulletDot} />
        <ThemedText variant="body" color={colors.text.secondary} style={styles.bulletText}>
            {point}
        </ThemedText>
    </View>
);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    lastUpdated: {
        marginBottom: 20,
        fontStyle: 'italic',
        color: colors.text.tertiary,
    },
    intro: {
        marginBottom: 24,
        color: colors.text.secondary,
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
        color: colors.text.primary,
        fontSize: 18,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingRight: 10,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginTop: 8,
        marginRight: 10,
    },
    bulletText: {
        flex: 1,
        lineHeight: 22,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: 12,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(251, 113, 133, 0.2)',
    }
});

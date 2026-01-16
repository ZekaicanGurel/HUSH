import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Switch } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { Info, RefreshCw, Globe, ChevronRight, Bell, Crown, Shield, Brain } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { useNavigation } from '@react-navigation/native';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { useI18nStore } from '../i18n';

export const SettingsScreen = () => {
    const navigation = useNavigation();
    const { t, language, setLanguage } = useI18nStore();
    const isPremium = useHushStore(state => state.isPremium);
    const smartSuggestionsEnabled = useHushStore(state => state.smartSuggestionsEnabled ?? true);
    const toggleSmartSuggestions = useHushStore(state => state.toggleSmartSuggestions);
    const { restorePurchases } = useRevenueCat();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'tr' : 'en');
    };

    const openNotificationSettings = () => {
        Linking.openSettings();
    };

    const handleFeedback = () => {
        const subject = t('settings_feedback_subject');
        Linking.openURL(`mailto:support@hushapp.com?subject=${subject}`);
    };

    return (
        <ScreenWrapper>
            <ThemedText variant="header" style={styles.header}>{t('settings_header')}</ThemedText>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Premium Banner */}
                {!isPremium ? (
                    <TouchableOpacity style={styles.premiumBanner} onPress={() => navigation.navigate('Premium' as never)}>
                        <View style={styles.premiumContent}>
                            <Crown size={24} color={colors.background} />
                            <View style={{ marginLeft: 16 }}>
                                <ThemedText variant="title" style={{ color: colors.background }}>{t('home_hush_premium')}</ThemedText>
                                <ThemedText variant="caption" style={{ color: colors.background }}>{t('premium_subtitle')}</ThemedText>
                            </View>
                        </View>
                        <ChevronRight size={20} color={colors.background} />
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.premiumBanner, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }]}>
                        <View style={styles.premiumContent}>
                            <Crown size={24} color={colors.primary} />
                            <View style={{ marginLeft: 16 }}>
                                <ThemedText variant="title" style={{ color: colors.primary }}>{t('home_hush_premium')}</ThemedText>
                                <ThemedText variant="caption" style={{ color: colors.text.secondary }}>{t('premium_active_badge')}</ThemedText>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>{t('settings_smart_features')}</ThemedText>
                    <View style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Brain size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <View>
                                <ThemedText variant="body">{t('settings_smart_suggestions')}</ThemedText>
                                <ThemedText variant="caption" color={colors.text.secondary}>{t('settings_smart_suggestions_desc')}</ThemedText>
                            </View>
                        </View>
                        <Switch
                            value={smartSuggestionsEnabled}
                            onValueChange={toggleSmartSuggestions}
                            trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>GENERAL</ThemedText>
                    {/* ... Language & Notifs ... */}
                    <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
                        <View style={styles.menuLeft}>
                            <Globe size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <View>
                                <ThemedText variant="body">{t('settings_language')}</ThemedText>
                                <ThemedText variant="caption" color={colors.text.secondary}>{language === 'en' ? 'English' : 'Türkçe'}</ThemedText>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ThemedText variant="caption" style={{ marginRight: 8, color: colors.primary }}>{language.toUpperCase()}</ThemedText>
                            <RefreshCw size={14} color={colors.text.tertiary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={openNotificationSettings}>
                        <View style={styles.menuLeft}>
                            <Bell size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <ThemedText variant="body">{t('settings_notifications')}</ThemedText>
                        </View>
                        <ChevronRight size={20} color={colors.text.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleFeedback}>
                        <View style={styles.menuLeft}>
                            <View style={{ width: 20, alignItems: 'center', marginRight: 16 }}><Info size={20} color={colors.text.primary} /></View>
                            <ThemedText variant="body">{t('settings_feedback')}</ThemedText>
                        </View>
                        <ChevronRight size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>PREMIUM</ThemedText>

                    <TouchableOpacity style={styles.menuItem} onPress={restorePurchases}>
                        <View style={styles.menuLeft}>
                            <RefreshCw size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <ThemedText variant="body">{t('settings_restore')}</ThemedText>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>ABOUT</ThemedText>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy' as never)}>
                        <View style={styles.menuLeft}>
                            <Shield size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <ThemedText variant="body">{t('settings_privacy')}</ThemedText>
                        </View>
                        <ChevronRight size={20} color={colors.text.secondary} />
                    </TouchableOpacity>

                    <View style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Info size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <ThemedText variant="body">{t('settings_version')} 2.0.0</ThemedText>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    header: {
        marginVertical: layout.spacing.m,
    },
    content: {
        paddingBottom: layout.spacing.xxl,
    },
    premiumBanner: {
        backgroundColor: colors.primary,
        borderRadius: layout.borderRadius.m,
        padding: layout.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: layout.spacing.xl,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 16,
    },
    section: {
        marginBottom: layout.spacing.xl,
    },
    sectionTitle: {
        marginBottom: layout.spacing.s,
        marginLeft: layout.spacing.s,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: layout.spacing.m,
        paddingHorizontal: layout.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

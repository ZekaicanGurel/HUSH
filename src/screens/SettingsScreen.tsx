import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { Bell, Shield, Crown, ChevronRight, Info, RefreshCw, Globe, Trash2 } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { NativeNotificationService } from '../services/NativeNotificationService';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { useI18nStore } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen = () => {
    const isPremium = useHushStore(state => state.isPremium);
    const activeFocusModeId = useHushStore(state => state.activeFocusModeId);
    const navigation = useNavigation();

    // Auth & I18n
    const { t, language, setLanguage } = useI18nStore();

    // RevenueCat Hook
    const { showCustomerCenter, restorePurchases } = useRevenueCat();

    const openNotificationSettings = () => {
        NativeNotificationService.openSettings();
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'tr' : 'en');
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
                                <ThemedText variant="caption" style={{ color: colors.text.secondary }}>Active</ThemedText>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>GENERAL</ThemedText>

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
                </View>

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>PREMIUM</ThemedText>

                    <TouchableOpacity style={styles.menuItem} onPress={restorePurchases}>
                        <View style={styles.menuLeft}>
                            <RefreshCw size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <ThemedText variant="body">{t('settings_restore')}</ThemedText>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Info size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                            <ThemedText variant="body">{t('settings_contact')}</ThemedText>
                        </View>
                        <ChevronRight size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="caption" color={colors.text.tertiary} style={styles.sectionTitle}>ABOUT</ThemedText>
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

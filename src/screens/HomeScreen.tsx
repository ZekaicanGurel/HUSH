import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, LayoutAnimation, UIManager } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { BellOff, CheckCircle, Smartphone, Brain, Shield } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { NativeNotificationService } from '../services/NativeNotificationService';
import { formatDistanceToNow } from 'date-fns';
import { useI18nStore } from '../i18n';

// Enable LayoutAnimation for Android
import { useNavigation } from '@react-navigation/native';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { useFocusSuggestions } from '../hooks/useFocusSuggestions';

export const HomeScreen = () => {
    const navigation = useNavigation();
    const stats = useHushStore(state => state.stats);
    const logs = useHushStore(state => state.logs || []);
    const dismissSuggestion = useHushStore(state => state.dismissSuggestion);
    const toggleAppMute = useHushStore(state => state.toggleAppMute);
    const activeFocusModeId = useHushStore(state => state.activeFocusModeId);
    const isPremium = useHushStore(state => state.isPremium);

    const { t } = useI18nStore();
    const [hasPermission, setHasPermission] = React.useState(false);

    // AI Suggestions (New Hook)
    const suggestions = useFocusSuggestions();

    useEffect(() => {
        // Initialize Native Service
        NativeNotificationService.init();
        checkPerms();
    }, []);

    const checkPerms = async () => {
        const granted = await NativeNotificationService.checkPermission();
        setHasPermission(granted);
    }

    const handleSetup = () => {
        NativeNotificationService.openSettings();
    };

    const handleSuggestionAction = (suggestion: any, accept: boolean) => {
        if (accept) {
            // Execute Action
            if (suggestion.type === 'app_block' && suggestion.data?.packageName) {
                toggleAppMute(suggestion.data.packageName);
            } else if (suggestion.type === 'mode_recommendation' && suggestion.data?.modeId) {
                const setFocusMode = useHushStore.getState().setFocusMode;
                setFocusMode(suggestion.data.modeId);
            } else if (suggestion.type === 'schedule') {
                (navigation as any).navigate('Schedules', {
                    create: true,
                    modeId: suggestion.data?.modeId,
                    time: suggestion.data?.time
                });
            }
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dismissSuggestion(suggestion.id);
    };

    // Filter out dismissed (Hook already filters, just allow pass-through)
    const activeSuggestions = suggestions;

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, hasPermission && { backgroundColor: isPremium ? colors.accent : colors.status.success }]} />
                        <ThemedText variant="caption" style={{
                            color: hasPermission ? (isPremium ? colors.accent : colors.status.success) : colors.status.warning,
                            letterSpacing: 0.5,
                            fontSize: 11,
                            fontWeight: '600'
                        }}>
                            {Platform.OS === 'android' ? (hasPermission ? (isPremium ? t('home_hush_premium') : t('home_hush_active')) : t('home_permission_needed')) : 'HUSH GUIDE'}
                        </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText variant="header" style={{ marginTop: 4 }}>{t('home_header')}</ThemedText>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {!hasPermission && Platform.OS === 'android' && (
                                <TouchableOpacity onPress={handleSetup} style={styles.simButton}>
                                    <Shield size={18} color={colors.background} />
                                </TouchableOpacity>
                            )}
                            {activeFocusModeId && (
                                <View style={styles.activeModeBadge}>
                                    <ThemedText variant="caption" style={{ color: colors.background, fontWeight: '700', fontSize: 10 }}>
                                        {t('focus_active') || 'ACTIVE'}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Summary Card */}
                <Card style={styles.summaryCard}>
                    <View style={styles.summaryIconContainer}>
                        <BellOff size={28} color={colors.primary} />
                    </View>

                    <View style={{ marginTop: 16, alignItems: 'center' }}>
                        <ThemedText variant="header" style={{ fontSize: 42, color: colors.text.primary, lineHeight: 48 }}>
                            {stats.mutedCount}
                        </ThemedText>
                        <ThemedText variant="body" style={{ color: colors.text.secondary, marginTop: 4 }}>
                            {t('home_notifications_muted')}
                        </ThemedText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.insightContainer}>
                        <View style={styles.miniIcon}>
                            <CheckCircle size={12} color={colors.primary} />
                        </View>
                        <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
                            <ThemedText variant="caption" style={{ fontWeight: 'bold', color: colors.text.primary }}>
                                {stats.deliveredCount}
                            </ThemedText> {t('home_important_delivered')}
                        </ThemedText>
                    </View>
                </Card>

                <ThemedText variant="body" center style={{ marginTop: 24, marginBottom: 8, color: colors.text.secondary }}>
                    {t('home_minutes_saved_text', { minutes: Math.round(stats.minutesSaved) })}
                </ThemedText>

                {/* Smart Suggestion - Show only if exists */}
                {activeSuggestions.length > 0 && (
                    <Card style={styles.suggestionCard}>
                        <View style={styles.suggestionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ padding: 6, backgroundColor: 'rgba(94, 234, 212, 0.15)', borderRadius: 8 }}>
                                    <Brain size={16} color={colors.primary} />
                                </View>
                                <ThemedText variant="title" style={{ fontSize: 15 }}>Smart Suggestion</ThemedText>
                            </View>
                            <ThemedText variant="caption" color={colors.text.tertiary}>Just now</ThemedText>
                        </View>

                        <ThemedText variant="body" style={{ marginTop: 12, marginBottom: 4, fontWeight: '600' }}>
                            {activeSuggestions[0].title}
                        </ThemedText>
                        <ThemedText variant="caption" color={colors.text.secondary} style={{ marginBottom: 16, lineHeight: 20 }}>
                            {activeSuggestions[0].description}
                        </ThemedText>

                        <View style={styles.suggestionActions}>
                            <TouchableOpacity
                                onPress={() => handleSuggestionAction(activeSuggestions[0], false)}
                                style={[styles.suggestionBtn, { backgroundColor: 'transparent' }]}
                            >
                                <ThemedText variant="caption" style={{ color: colors.text.tertiary }}>{t('cancel') || 'Ignore'}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleSuggestionAction(activeSuggestions[0], true)}
                                style={[styles.suggestionBtn, { backgroundColor: 'rgba(94, 234, 212, 0.15)', marginLeft: 8 }]}
                            >
                                <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>{t('save') || 'Apply'}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}

                {/* Recent Activity Live Log */}
                <View style={styles.sectionHeader}>
                    <ThemedText variant="title" style={{ fontSize: 18 }}>{t('home_recent_activity')}</ThemedText>
                </View>

                {logs.slice(0, 5).map(log => (
                    <Card key={log.id} style={styles.activityItem}>
                        <View style={styles.appRow}>
                            <View style={[styles.appIconPlaceholder, log.status === 'delivered' && { backgroundColor: 'rgba(94, 234, 212, 0.1)' }]} >
                                <Smartphone size={16} color={log.status === 'delivered' ? colors.primary : colors.text.tertiary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <ThemedText variant="body" style={{ fontWeight: '600', color: colors.text.primary }}>{log.appName}</ThemedText>
                                <ThemedText variant="caption" style={{ color: colors.text.tertiary, marginTop: 2 }}>{formatDistanceToNow(log.timestamp)} ago</ThemedText>
                            </View>
                            <View style={{
                                paddingHorizontal: 10, paddingVertical: 4,
                                borderRadius: 12,
                                backgroundColor: log.status === 'muted' ? 'rgba(255,255,255,0.05)' : 'rgba(94, 234, 212, 0.1)'
                            }}>
                                <ThemedText variant="caption" style={{
                                    fontSize: 10, fontWeight: '600',
                                    color: log.status === 'muted' ? colors.text.tertiary : colors.primary
                                }}>
                                    {log.status === 'muted' ? 'Muted' : 'Delivered'}
                                </ThemedText>
                            </View>
                        </View>
                    </Card>
                ))}

                {logs.length === 0 && (
                    <Card style={{ padding: 32, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 0, elevation: 0 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                            <BellOff size={20} color={colors.text.tertiary} />
                        </View>
                        <ThemedText variant="caption" center style={{ color: colors.text.tertiary }}>
                            {t('home_waiting')}
                        </ThemedText>
                    </Card>
                )}

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: layout.spacing.xxl,
    },
    header: {
        marginBottom: layout.spacing.l,
        marginTop: layout.spacing.m,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.text.tertiary,
        marginRight: 8,
    },
    simButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeModeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: colors.primary,
        borderRadius: 12,
    },
    summaryCard: {
        alignItems: 'center',
        paddingVertical: 24, // Tighter padding
    },
    summaryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(94, 234, 212, 0.1)', // Soft transparent teal
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        width: '80%', // Not full width
        marginVertical: 20,
    },
    insightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniIcon: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: 'rgba(94, 234, 212, 0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    suggestionCard: {
        marginTop: 16,
        borderColor: 'rgba(94, 234, 212, 0.3)', // Subtle primary border
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    suggestionActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    suggestionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    sectionHeader: {
        marginTop: 32,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    activityItem: {
        marginBottom: 10, // Tighter list
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16, // Softer items
    },
    appRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appIconPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 12, // Soft square
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

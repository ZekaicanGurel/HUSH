import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { Smartphone, MessageCircle, Briefcase, ShoppingBag, DollarSign, Shield, Monitor, Zap, Search, X } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { startOfDay } from 'date-fns';
import { computeBlockedApps, categorizeApp } from '../data/focusModeRules';
import { useI18nStore } from '../i18n';

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const getIcon = (iconName: string) => {
    switch (iconName) {
        case 'MessageCircle': return MessageCircle;
        case 'Briefcase': return Briefcase;
        case 'ShoppingBag': return ShoppingBag;
        case 'DollarSign': return DollarSign;
        case 'Shield': return Shield;
        case 'Monitor': return Monitor;
        case 'Zap': return Zap;
        default: return Smartphone;
    }
}

export const InsightsScreen = () => {
    const apps = useHushStore(state => state.apps || []);
    const logs = useHushStore(state => state.logs || []);
    const toggleAppMute = useHushStore(state => state.toggleAppMute);
    const refreshInstalledApps = useHushStore(state => state.refreshInstalledApps);
    const activeFocusModeId = useHushStore(state => state.activeFocusModeId);
    const focusModes = useHushStore(state => state.focusModes || []);
    const userOverrides = useHushStore(state => state.userOverrides) || {};
    const { t } = useI18nStore();

    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    React.useEffect(() => {
        refreshInstalledApps();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshInstalledApps();
        setRefreshing(false);
    }, []);

    // Computed: Mute counts per app today
    const appStats = useMemo(() => {
        const stats: Record<string, number> = {};
        const dayStart = startOfDay(new Date()).getTime();

        logs.forEach(log => {
            if (log.status === 'muted' && log.timestamp >= dayStart) {
                stats[log.appId] = (stats[log.appId] || 0) + 1;
            }
        });
        return stats;
    }, [logs]);

    // Computed: Active Focus Mode
    const activeFocusMode = useMemo(() => {
        if (!activeFocusModeId) return null;
        return focusModes.find(m => m.id === activeFocusModeId) || null;
    }, [activeFocusModeId, focusModes]);

    // Computed: Which apps are blocked by active focus mode
    const blockedByFocusMode = useMemo(() => {
        if (!activeFocusMode) return new Set<string>();

        const appsWithCategories = apps.map(a => ({
            packageName: a.id,
            appName: a.name,
            category: categorizeApp(a.id, a.name),
        }));

        const blocked = computeBlockedApps(appsWithCategories, activeFocusMode, userOverrides);
        return new Set(blocked || []);
    }, [activeFocusMode, apps, userOverrides]);

    // Filtered apps based on search
    const filteredApps = useMemo(() => {
        if (!debouncedSearch.trim()) return apps;
        const query = debouncedSearch.toLowerCase();
        return apps.filter(app =>
            app.name.toLowerCase().includes(query) ||
            (app.category && app.category.toLowerCase().includes(query))
        );
    }, [apps, debouncedSearch]);

    return (
        <ScreenWrapper>
            <FlatList
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <ThemedText variant="header">{t('insights_header')}</ThemedText>
                            <ThemedText variant="caption" color={colors.text.secondary}>{t('insights_subtitle')}</ThemedText>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Search size={18} color={colors.text.tertiary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('focus_search_placeholder')}
                                placeholderTextColor={colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                    <X size={16} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                }
                data={filteredApps}
                extraData={activeFocusModeId}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ThemedText variant="body" color={colors.text.tertiary}>
                            {debouncedSearch ? t('focus_apps_no_match', { query: debouncedSearch }) : t('insights_no_apps')}
                        </ThemedText>
                    </View>
                }
                renderItem={({ item }) => {
                    const Icon = getIcon(item.iconName);
                    const mutedCount = appStats[item.id] || 0;

                    // Check if blocked by Focus Mode using category-based rules
                    const isBlockedByFocus = blockedByFocusMode.has(item.id);
                    const isEffectivelyMuted = item.isMuted || isBlockedByFocus;

                    return (
                        <Card style={styles.appCard}>
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, isEffectivelyMuted && { borderColor: colors.primary, backgroundColor: 'rgba(61, 255, 178, 0.1)' }]}>
                                    <Icon size={24} color={isEffectivelyMuted ? colors.primary : colors.text.secondary} />
                                </View>

                                <View style={styles.infoContainer}>
                                    <ThemedText variant="title" style={{ fontSize: 16 }}>{item.name}</ThemedText>
                                    <ThemedText variant="caption" color={colors.text.secondary}>
                                        {item.category} • {t('insights_blocked_today', { count: mutedCount })}
                                    </ThemedText>
                                    {isBlockedByFocus && (
                                        <ThemedText variant="caption" style={{ color: colors.accent, fontSize: 10, marginTop: 2 }}>
                                            • {t('insights_blocked_by', { mode: activeFocusMode?.name ?? '' })}
                                        </ThemedText>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.actionButton, isEffectivelyMuted && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    onPress={() => toggleAppMute(item.id)}
                                    disabled={item.important}
                                >
                                    <ThemedText variant="caption" style={{ color: isEffectivelyMuted ? colors.background : colors.text.primary, fontWeight: 'bold' }}>
                                        {item.important ? t('insights_safe') : (isEffectivelyMuted ? (isBlockedByFocus ? t('insights_status_focus') : t('insights_unmute')) : t('insights_mute'))}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    );
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        marginVertical: layout.spacing.m,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text.primary,
    },
    clearButton: {
        padding: 4,
    },
    listContent: {
        paddingBottom: layout.spacing.xxl,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    appCard: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 70,
        alignItems: 'center',
    },
});

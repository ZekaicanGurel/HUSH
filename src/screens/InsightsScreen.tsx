import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { Smartphone, MessageCircle, Briefcase, ShoppingBag, DollarSign, Shield, Monitor, Zap } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { startOfDay } from 'date-fns';

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
    const apps = useHushStore(state => state.apps);
    const logs = useHushStore(state => state.logs);
    const toggleAppMute = useHushStore(state => state.toggleAppMute);
    const refreshInstalledApps = useHushStore(state => state.refreshInstalledApps);
    const [refreshing, setRefreshing] = React.useState(false);

    React.useEffect(() => {
        refreshInstalledApps();
    }, []);

    const onRefresh = React.useCallback(async () => {
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

    return (
        <ScreenWrapper>
            <FlatList
                ListHeaderComponent={
                    <View style={styles.header}>
                        <ThemedText variant="header">Managed Apps</ThemedText>
                        <ThemedText variant="caption" color={colors.text.secondary}>Control which apps are silenced</ThemedText>
                    </View>
                }
                data={apps}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                renderItem={({ item }) => {
                    const Icon = getIcon(item.iconName);
                    const mutedCount = appStats[item.id] || 0;

                    return (
                        <Card style={styles.appCard}>
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, item.isMuted && { borderColor: colors.primary, backgroundColor: 'rgba(61, 255, 178, 0.1)' }]}>
                                    <Icon size={24} color={item.isMuted ? colors.primary : colors.text.secondary} />
                                </View>

                                <View style={styles.infoContainer}>
                                    <ThemedText variant="title" style={{ fontSize: 16 }}>{item.name}</ThemedText>
                                    <ThemedText variant="caption" color={colors.text.secondary}>
                                        {item.category} • Blocked {mutedCount} today
                                    </ThemedText>
                                </View>

                                <TouchableOpacity
                                    style={[styles.actionButton, item.isMuted && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    onPress={() => toggleAppMute(item.id)}
                                    disabled={item.important}
                                >
                                    <ThemedText variant="caption" style={{ color: item.isMuted ? colors.background : colors.text.primary, fontWeight: 'bold' }}>
                                        {item.important ? 'Safe' : (item.isMuted ? 'Unmute' : 'Mute')}
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
        marginBottom: 24,
    },
    listContent: {
        paddingBottom: layout.spacing.xxl,
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

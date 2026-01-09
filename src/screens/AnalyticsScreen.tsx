import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import {
    Smartphone, Shield, Zap, TrendingUp, Lock,
    CheckCircle, AlertCircle, Clock
} from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useHushStore } from '../store/useHushStore';
import { format, subDays, isSameDay, startOfDay, getDay, getHours } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import LinearGradient from 'react-native-linear-gradient';
import { useI18nStore } from '../i18n';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export const AnalyticsScreen = () => {
    const apps = useHushStore(state => state.apps);
    const logs = useHushStore(state => state.logs);
    const isPremium = useHushStore(state => state.isPremium);
    const navigation = useNavigation();
    const { t } = useI18nStore();
    const [tooltip, setTooltip] = useState<{ day: string, hour: string, count: number, x: number, y: number } | null>(null);

    // --- DATA CALCULATIONS ---

    // 1. Last 7 Days & Peak Hour
    const { dailyBlockedData, totalToday, peakHour, hasData } = useMemo(() => {
        const today = new Date();
        const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
        const counts = new Array(24).fill(0);
        let todayCount = 0;
        let totalCount = 0;

        const data = last7.map((date, index) => {
            const isToday = index === 6;
            const dayLogs = logs.filter(l => isSameDay(new Date(l.timestamp), date));

            dayLogs.forEach(log => {
                if (log.status === 'muted') {
                    counts[new Date(log.timestamp).getHours()]++;
                    totalCount++;
                }
            });

            const count = dayLogs.filter(l => l.status === 'muted').length;
            if (isToday) todayCount = count;

            return {
                value: count,
                label: format(date, 'EEE'),
                frontColor: isToday ? colors.primary : 'rgba(255,255,255,0.1)',
                labelTextStyle: { color: isToday ? colors.primary : colors.text.tertiary, fontSize: 10 },
            };
        });

        const maxHourVal = Math.max(...counts);
        const peak = maxHourVal > 0 ? counts.indexOf(maxHourVal) : -1;

        return {
            dailyBlockedData: data,
            totalToday: todayCount,
            peakHour: peak,
            hasData: totalCount > 0
        };
    }, [logs]);

    const maxDailyBlocked = Math.max(...dailyBlockedData.map(d => d.value), 4);

    // 2. Top Distractor Today
    const todaysTopDistractor = useMemo(() => {
        const today = startOfDay(new Date()).getTime();
        const todayLogs = logs.filter(l => l.status === 'muted' && l.timestamp >= today);
        const stats: Record<string, number> = {};
        todayLogs.forEach(l => {
            stats[l.appId] = (stats[l.appId] || 0) + 1;
        });

        const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return null;

        const [appId, count] = entries[0];
        const app = apps.find(a => a.id === appId);
        const percent = Math.round((count / todayLogs.length) * 100);
        return { name: app?.name || 'Unknown App', count, percent };
    }, [logs, apps]);

    // 3. Premium Stats (Focus Score & Trend)
    const premiumStats = useMemo(() => {
        const today = startOfDay(new Date()).getTime();
        const todayLogs = logs.filter(l => l.timestamp >= today);

        if (todayLogs.length === 0) {
            return { score: 100, trend: "Stable", percentChange: 0 };
        }

        const blockedCount = todayLogs.filter(l => l.status === 'muted').length;
        const totalCount = todayLogs.length;

        const score = Math.round(50 + (blockedCount / totalCount) * 50);

        const yesterday = startOfDay(subDays(new Date(), 1)).getTime();
        const yesterdayLogs = logs.filter(l => l.timestamp >= yesterday && l.timestamp < today);
        const yesterdayBlocked = yesterdayLogs.filter(l => l.status === 'muted').length;

        let trend = "Stable";
        if (blockedCount > yesterdayBlocked) trend = "Improving";
        if (blockedCount < yesterdayBlocked) trend = "Needs Attention";

        const percentChange = yesterdayBlocked > 0
            ? Math.round(((blockedCount - yesterdayBlocked) / yesterdayBlocked) * 100)
            : 0;

        return { score, trend, percentChange };
    }, [logs]);

    // 4. Heatmap Data (Premium)
    const heatmapData = useMemo(() => {
        // Grid: 7 days (Mon-Sun as 0-6 relative to now? Or fixed Mon-Sun?). 
        // Let's use 7 days of week fixed: 0=Sun, 1=Mon, ..., 6=Sat
        const grid = Array.from({ length: 7 }, () => Array(24).fill(0));

        // Loop through all logs for heatmap population
        // Limit to reasonable history (e.g. 30 days) if logs are huge, but here we take all.
        logs.forEach(log => {
            if (log.status === 'muted') {
                const date = new Date(log.timestamp);
                const day = getDay(date); // 0 = Sun
                const hour = getHours(date);
                grid[day][hour]++;
            }
        });

        // Reorder to Mon-Sun (Mon=0 in our UI index to Sun=6)
        // getDay returns 0 for Sunday. We want Monday first.
        const orderedGrid = [
            grid[1], // Mon
            grid[2], // Tue
            grid[3], // Wed
            grid[4], // Thu
            grid[5], // Fri
            grid[6], // Sat
            grid[0], // Sun
        ];

        // Find max for scaling colors
        let maxVal = 0;
        orderedGrid.flat().forEach(v => { if (v > maxVal) maxVal = v; });

        return { grid: orderedGrid, max: maxVal > 0 ? maxVal : 1 };
    }, [logs]);

    const activeTimesText = useMemo(() => {
        // Simple logic to generate insight text from heatmap
        if (!heatmapData || heatmapData.max === 0) return "No data yet to determine patterns.";

        // Find busiest "quadrant"
        // Morning: 6-12, Afternoon: 12-18, Evening: 18-24
        let morning = 0, afternoon = 0, evening = 0;
        heatmapData.grid.forEach(row => {
            for (let h = 6; h < 12; h++) morning += row[h];
            for (let h = 12; h < 18; h++) afternoon += row[h];
            for (let h = 18; h < 24; h++) evening += row[h];
        });

        if (evening > afternoon && evening > morning) return "You are most distracted in the evenings.";
        if (afternoon > morning) return "Afternoons are your busiest time.";
        return "Mornings cause the most interruptions.";
    }, [heatmapData]);


    // --- SUB COMPONENTS ---

    // The Heatmap Cell
    const HeatmapCell = ({ value, max, dayIndex, hourIndex }: any) => {
        // Color scale
        const intensity = value / max; // 0 to 1
        let backgroundColor = 'rgba(255,255,255,0.03)'; // Empty

        if (value > 0) {
            // Use primary (Teal) with opacity based on intensity
            // Min opacity 0.2 so it's visible if blocked
            const opacity = 0.2 + (intensity * 0.8);
            // #5EEAD4 is RGB(94, 234, 212)
            backgroundColor = `rgba(94, 234, 212, ${opacity})`;
        }

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const dayName = days[dayIndex];
                    const hourRange = `${hourIndex}:00-${hourIndex + 1}:00`;
                    setTooltip({
                        day: dayName,
                        hour: hourRange,
                        count: value,
                        x: hourIndex * ((CARD_WIDTH - 60) / 24), // Approx position
                        y: dayIndex * 20
                    });
                    // Clear tooltip after 3s
                    setTimeout(() => setTooltip(null), 3000);
                }}
                style={{
                    flex: 1,
                    height: 20, // tall cells
                    backgroundColor,
                    margin: 1,
                    borderRadius: 3
                }}
            />
        );
    };

    const InsightRow = ({ icon: Icon, title, subtext, locked, onPress, expandedContent }: any) => (
        <View>
            <TouchableOpacity
                style={styles.insightRow}
                activeOpacity={locked ? 0.7 : 1}
                onPress={locked ? onPress : undefined}
            >
                <View style={styles.insightIconBox}>
                    <Icon size={18} color={locked ? colors.text.secondary : colors.primary} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 16 }}>
                    <ThemedText variant="body" style={{ fontWeight: '600', color: colors.text.primary }}>{title}</ThemedText>
                    <ThemedText variant="caption" color={colors.text.tertiary}>{subtext}</ThemedText>
                </View>
                {locked && <Lock size={16} color={colors.text.tertiary} />}
            </TouchableOpacity>
            {!locked && expandedContent && (
                <View style={styles.expandedContent}>
                    {expandedContent}
                </View>
            )}
        </View>
    );

    const formatTime = (hour: number) => {
        if (hour === -1) return "random times";
        if (hour === 0) return "midnight";
        if (hour === 12) return "noon";
        return `${hour}:00`;
    }

    // --- RENDER ---


    // Insight Text Logic
    let insightText = t('analytics_insight_same');
    if (premiumStats.percentChange > 0) insightText = t('analytics_insight_more', { percent: premiumStats.percentChange });
    if (premiumStats.percentChange < 0) insightText = t('analytics_insight_less', { percent: Math.abs(premiumStats.percentChange) });

    return (
        <ScreenWrapper>
            <FlatList
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <ThemedText variant="header">{t('analytics_header')}</ThemedText>
                            <ThemedText variant="caption" color={colors.text.tertiary}>{t('analytics_subtitle')}</ThemedText>
                        </View>

                        {/* --- WEEKLY INSIGHT (NEW MVP ELEMENT) --- */}
                        <Card style={[styles.chartCard, { paddingVertical: 16 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <View style={{ padding: 8, backgroundColor: 'rgba(94, 234, 212, 0.1)', borderRadius: 12, marginRight: 16 }}>
                                    <TrendingUp size={20} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variant="body" style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('analytics_weekly_insight')}</ThemedText>
                                    <ThemedText variant="caption" color={colors.text.secondary} style={{ lineHeight: 20 }}>
                                        {insightText}
                                    </ThemedText>
                                </View>
                            </View>
                        </Card>

                        {/* --- FREE SECTION (TOP) --- */}
                        <Card style={styles.chartCard}>
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <ThemedText variant="title">{t('analytics_activity')}</ThemedText>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Shield size={14} color={colors.primary} style={{ marginRight: 6 }} />
                                        <ThemedText variant="caption" style={{ fontWeight: 'bold', color: colors.primary }}>
                                            {totalToday} {t('analytics_blocked_caps')}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>
                            <BarChart
                                data={dailyBlockedData}
                                barWidth={32}
                                spacing={8}
                                roundedTop
                                hideRules
                                xAxisThickness={0}
                                yAxisThickness={0}
                                hideYAxisText
                                height={140}
                                width={CARD_WIDTH - 64}
                                maxValue={maxDailyBlocked + 2}
                                initialSpacing={8}
                                isAnimated={false}
                                activeOpacity={0.8}
                                noOfSections={3}
                            />
                            <View style={styles.chartFooter}>
                                <ThemedText variant="body" style={{ fontWeight: '500' }}>
                                    {totalToday > 0 ? t('analytics_active_today') : t('analytics_quiet_today')}
                                </ThemedText>
                                <ThemedText variant="caption" color={colors.text.tertiary}>
                                    {hasData ? t('analytics_peak_time', { time: formatTime(peakHour) }) : t('analytics_no_peak')}
                                </ThemedText>
                            </View>
                        </Card>

                        <Card style={styles.summaryCard}>
                            {todaysTopDistractor ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 113, 133, 0.1)' }]}>
                                        <AlertCircle size={24} color={colors.status.error} />
                                    </View>
                                    <View style={{ marginLeft: 16 }}>
                                        <ThemedText variant="body" style={{ fontWeight: 'bold', color: colors.status.error }}>{todaysTopDistractor.name}</ThemedText>
                                        <ThemedText variant="caption" color={colors.text.secondary}>{t('analytics_distracted_most')}</ThemedText>
                                    </View>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(94, 234, 212, 0.1)' }]}>
                                        <CheckCircle size={24} color={colors.primary} />
                                    </View>
                                    <View style={{ marginLeft: 16 }}>
                                        <ThemedText variant="body" style={{ fontWeight: 'bold', color: colors.primary }}>{t('analytics_pure_focus')}</ThemedText>
                                        <ThemedText variant="caption" color={colors.text.secondary}>{t('analytics_pure_focus_desc')}</ThemedText>
                                    </View>
                                </View>
                            )}
                        </Card>

                        {/* --- PREMIUM SECTION (BOTTOM) --- */}
                        <View style={styles.premiumSection}>
                            <ThemedText variant="caption" style={styles.premiumLabel}>{t('analytics_premium_section')}</ThemedText>

                            {/* NEW: Heatmap Card (Hero) */}
                            <Card style={[styles.premiumGroup, { marginBottom: 16, padding: 0 }]}>
                                <View style={{ padding: 20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <View>
                                            <ThemedText variant="title">{t('analytics_activity_pattern')}</ThemedText>
                                            <ThemedText variant="caption" color={colors.text.tertiary}>
                                                {isPremium ? activeTimesText : t('analytics_activity_desc')}
                                            </ThemedText>
                                        </View>
                                        {!isPremium && <Lock size={16} color={colors.accent} />}
                                    </View>

                                    {/* The Heatmap Visual */}
                                    <View style={{ height: 160 }}>
                                        {/* X-Axis Labels */}
                                        <View style={{ flexDirection: 'row', marginLeft: 30, marginBottom: 4 }}>
                                            {[0, 6, 12, 18].map(h => (
                                                <ThemedText key={h} variant="caption" style={{ position: 'absolute', left: `${(h / 24) * 100}%`, fontSize: 10, color: colors.text.tertiary }}>
                                                    {h}
                                                </ThemedText>
                                            ))}
                                            <ThemedText variant="caption" style={{ position: 'absolute', right: 0, fontSize: 10, color: colors.text.tertiary }}>23</ThemedText>
                                        </View>

                                        {/* Grid */}
                                        <View style={{ flex: 1 }}>
                                            {heatmapData.grid.map((row, i) => (
                                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                                    {/* Y-Axis Label */}
                                                    <View style={{ width: 30 }}>
                                                        <ThemedText variant="caption" style={{ fontSize: 10, color: colors.text.tertiary }}>
                                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                                        </ThemedText>
                                                    </View>
                                                    {/* Row Cells */}
                                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                                        {row.map((val, h) => (
                                                            <HeatmapCell key={h} value={val} max={heatmapData.max} dayIndex={i} hourIndex={h} />
                                                        ))}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Tooltip Overlay */}
                                        {tooltip && (
                                            <View style={{ position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 20 }}>
                                                <View style={styles.tooltipBox}>
                                                    <ThemedText variant="caption" style={{ fontWeight: 'bold' }}>{tooltip.day} · {tooltip.hour}</ThemedText>
                                                    <ThemedText variant="caption" color={colors.accent}>{tooltip.count} {t('analytics_tooltip_blocked')}</ThemedText>
                                                </View>
                                            </View>
                                        )}

                                        {/* Blur for Free Users */}
                                        {!isPremium && (
                                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                    <LinearGradient
                                                        colors={[colors.primary, colors.accent]}
                                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                        style={{ borderRadius: 20, padding: 1, opacity: 0.8 }}
                                                    >
                                                        <View style={{ backgroundColor: '#000', borderRadius: 19, paddingHorizontal: 16, paddingVertical: 8 }}>
                                                            <ThemedText variant="caption" style={{ fontWeight: 'bold', color: '#fff' }}>{t('analytics_premium_feature')}</ThemedText>
                                                        </View>
                                                    </LinearGradient>
                                                </View>
                                            </BlurView>
                                        )}
                                    </View>
                                </View>
                            </Card>


                            {/* Text Insights Group */}
                            <Card style={styles.premiumGroup}>
                                {/* Row 1: Focus Quality */}
                                <InsightRow
                                    icon={Zap}
                                    title={isPremium ? `${t('analytics_focus_score')}: ${premiumStats.score}` : t('analytics_focus_score')}
                                    subtext={isPremium ? t('analytics_focus_score_desc') : t('analytics_focus_score_desc')}
                                    locked={!isPremium}
                                    onPress={() => navigation.navigate('Premium' as never)}
                                    expandedContent={
                                        <View style={{ marginTop: 8 }}>
                                            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                                <LinearGradient
                                                    colors={[colors.primary, colors.accent]}
                                                    style={{ width: `${premiumStats.score}%`, height: '100%', borderRadius: 3 }}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                />
                                            </View>
                                        </View>
                                    }
                                />
                                <View style={styles.rowDivider} />

                                {/* Row 2: Causes */}
                                <InsightRow
                                    icon={Smartphone}
                                    title={isPremium ? t('analytics_causes') : t('analytics_causes')} // simplified translation usage
                                    subtext={isPremium
                                        ? `${todaysTopDistractor?.name || 'No apps'} caused ${todaysTopDistractor?.percent || 0}% of interruptions`
                                        : t('analytics_causes_desc')}
                                    locked={!isPremium}
                                    onPress={() => navigation.navigate('Premium' as never)}
                                />
                                <View style={styles.rowDivider} />

                                {/* Row 3: Trends */}
                                <InsightRow
                                    icon={TrendingUp}
                                    title={isPremium ? t('analytics_trends') : t('analytics_trends')}
                                    subtext={isPremium
                                        ? `${Math.abs(premiumStats.percentChange)}% change from yesterday`
                                        : t('analytics_trends_desc')}
                                    locked={!isPremium}
                                    onPress={() => navigation.navigate('Premium' as never)}
                                />

                                {!isPremium && (
                                    <TouchableOpacity
                                        style={styles.premiumBtn}
                                        onPress={() => navigation.navigate('Premium' as never)}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={[colors.primary, colors.accent]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.gradientBtn}
                                        >
                                            <ThemedText style={{ fontWeight: 'bold', color: '#0F172A' }}>{t('analytics_unlock_btn')}</ThemedText>
                                            <ThemedText style={{ fontSize: 10, color: 'rgba(15, 23, 42, 0.7)', marginTop: 2 }}>{t('analytics_unlock_subtext')}</ThemedText>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </Card>
                        </View>
                        <View style={{ height: 40 }} />
                    </>
                }
                data={[]}
                renderItem={null}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: 24,
        marginTop: 8,
    },
    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
    },
    chartFooter: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumSection: {
        marginBottom: 32,
    },
    premiumLabel: {
        marginBottom: 12,
        marginLeft: 4,
        fontWeight: 'bold',
        color: colors.text.tertiary,
        fontSize: 11,
        letterSpacing: 0.5,
    },
    premiumGroup: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    insightIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 72,
    },
    premiumBtn: {
        margin: 20,
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientBtn: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandedContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingLeft: 72, // Align with text
    },
    tooltipBox: {
        backgroundColor: colors.surfaceHighlight || '#334155',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    }
});

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Switch, SectionList, TextInput } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { SmartAppInfo, GroupedApps } from '../hooks/useSmartApps';
import { Search, X } from 'lucide-react-native';
import { useI18nStore } from '../i18n';

interface SmartAppListProps {
    groupedApps: GroupedApps;
    selectedApps: Set<string>;
    onToggleApp: (packageName: string) => void;
    searchPlaceholder?: string;
}

interface SectionData {
    title: string;
    data: SmartAppInfo[];
}

// Debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

export const SmartAppList: React.FC<SmartAppListProps> = ({
    groupedApps,
    selectedApps,
    onToggleApp,
    searchPlaceholder,
}) => {
    const { t } = useI18nStore();
    const placeholder = searchPlaceholder || t('focus_search_placeholder');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Filter and create sections
    const sections: SectionData[] = useMemo(() => {
        const query = debouncedSearch.toLowerCase().trim();
        const categoryOrder: (keyof GroupedApps)[] = ['Social', 'System Important', 'Finance', 'Work', 'Other'];

        return categoryOrder
            .map(category => {
                let apps = groupedApps[category] || [];

                // Apply search filter
                if (query) {
                    apps = apps.filter(app =>
                        app.appName.toLowerCase().includes(query)
                    );
                }

                return {
                    title: category,
                    data: apps,
                };
            })
            .filter(section => section.data.length > 0);
    }, [groupedApps, debouncedSearch]);

    const renderItem = ({ item }: { item: SmartAppInfo }) => {
        const isSelected = selectedApps.has(item.packageName);

        return (
            <TouchableOpacity
                style={styles.appRow}
                onPress={() => onToggleApp(item.packageName)}
                activeOpacity={0.7}
            >
                {/* App Icon */}
                {item.iconBase64 ? (
                    <Image
                        source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                        style={styles.appIcon}
                    />
                ) : (
                    <View style={[styles.appIcon, styles.placeholderIcon]}>
                        <ThemedText variant="body" style={{ fontSize: 20 }}>
                            {item.appName.charAt(0)}
                        </ThemedText>
                    </View>
                )}

                {/* App Info */}
                <View style={styles.appInfo}>
                    <ThemedText variant="body" style={styles.appName}>
                        {item.appName}
                    </ThemedText>
                    {item.isFromPlayStore && (
                        <ThemedText variant="caption" color={colors.text.tertiary}>
                            {t('app_play_store')}
                        </ThemedText>
                    )}
                </View>

                {/* Toggle */}
                <Switch
                    value={isSelected}
                    onValueChange={() => onToggleApp(item.packageName)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.text.primary}
                />
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }: { section: SectionData }) => (
        <View style={styles.sectionHeader}>
            <ThemedText variant="caption" style={styles.sectionTitle}>
                {(t(('cat_' + section.title.toLowerCase().replace(' ', '_')) as any) || section.title).toUpperCase()}
            </ThemedText>
            <ThemedText variant="caption" color={colors.text.tertiary}>
                {section.data.length} {t('app_count_suffix')}
            </ThemedText>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={18} color={colors.text.tertiary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={placeholder}
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <X size={16} color={colors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* App List */}
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.packageName}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ThemedText variant="body" color={colors.text.tertiary}>
                            {searchQuery ? t('focus_apps_no_match', { query: searchQuery }) : t('focus_no_apps_found')}
                        </ThemedText>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: colors.text.primary,
        fontSize: 16,
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    listContent: {
        paddingBottom: 120,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginTop: 8,
    },
    sectionTitle: {
        color: colors.primary,
        fontWeight: '600',
        letterSpacing: 1,
    },
    appRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    appIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        marginRight: 12,
    },
    placeholderIcon: {
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontWeight: '500',
        marginBottom: 2,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
});

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { BookOpen, Briefcase, Moon, Zap, Smile, Heart, Star, Sun, Coffee, Music, X, Search } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { useI18nStore } from '../i18n';

const ICONS = [
    { name: 'Smile', icon: Smile },
    { name: 'Heart', icon: Heart },
    { name: 'Star', icon: Star },
    { name: 'Sun', icon: Sun },
    { name: 'Coffee', icon: Coffee },
    { name: 'Music', icon: Music },
    { name: 'Zap', icon: Zap },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Moon', icon: Moon },
];

// Debounce hook for search performance
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export const FocusEditorScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const initialMode = (route.params as any)?.mode;
    const { t } = useI18nStore();

    const apps = useHushStore(state => state.apps);
    const addFocusMode = useHushStore(state => state.addFocusMode);
    const updateFocusMode = useHushStore(state => state.updateFocusMode);

    const [name, setName] = useState(initialMode?.name || '');
    const [selectedIcon, setSelectedIcon] = useState(initialMode?.icon || 'Smile');
    const [blockedApps, setBlockedApps] = useState<Set<string>>(new Set(initialMode?.blockedApps || []));

    // Search state with debouncing
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Filter apps based on search query (memoized for performance)
    const filteredApps = useMemo(() => {
        if (!debouncedSearch.trim()) {
            return apps;
        }
        const query = debouncedSearch.toLowerCase().trim();
        return apps.filter(app =>
            app.name.toLowerCase().includes(query)
        );
    }, [apps, debouncedSearch]);

    const toggleApp = (id: string) => {
        const newSet = new Set(blockedApps);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setBlockedApps(newSet);
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert(t('focus_error_name'));
            return;
        }

        const modeData = {
            name,
            description: t('focus_desc_custom', { count: blockedApps.size }),
            icon: selectedIcon,
            // Custom modes use explicit app blocking (not category-based)
            blockedCategories: [] as ('Social' | 'Entertainment' | 'Games' | 'Productivity' | 'Communication' | 'Education' | 'Finance' | 'Shopping' | 'News' | 'System' | 'Utility' | 'Health' | 'Travel' | 'Other')[],
            allowedCategories: [] as ('Social' | 'Entertainment' | 'Games' | 'Productivity' | 'Communication' | 'Education' | 'Finance' | 'Shopping' | 'News' | 'System' | 'Utility' | 'Health' | 'Travel' | 'Other')[],
            blockedApps: Array.from(blockedApps),
            allowedApps: [] as string[],
        };

        if (initialMode) {
            // Preserve existing flags when updating
            updateFocusMode({
                id: initialMode.id,
                isDefault: initialMode.isDefault ?? false,
                isCustom: initialMode.isCustom ?? true,
                ...modeData
            });
        } else {
            // New modes are always custom
            addFocusMode(modeData);
        }

        navigation.goBack();
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <ThemedText variant="header">{initialMode ? t('focus_edit_title') : t('focus_create_title')}</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Name Input */}
                {/* Name Input */}
                <ThemedText variant="title" style={styles.label}>{t('focus_name_label')}</ThemedText>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('focus_name_placeholder')}
                    placeholderTextColor={colors.text.tertiary}
                />

                {/* Icon Picker */}
                <ThemedText variant="title" style={styles.label}>{t('focus_icon_label')}</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                    {ICONS.map((item) => (
                        <TouchableOpacity
                            key={item.name}
                            style={[
                                styles.iconBtn,
                                selectedIcon === item.name && styles.selectedIconBtn
                            ]}
                            onPress={() => setSelectedIcon(item.name)}
                        >
                            <item.icon
                                size={24}
                                color={selectedIcon === item.name ? colors.background : colors.text.primary}
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* App Blocker */}
                <ThemedText variant="title" style={styles.label}>{t('focus_apps_label')}</ThemedText>
                <ThemedText variant="caption" color={colors.text.tertiary} style={{ marginBottom: 16 }}>
                    {t('focus_apps_help')}
                </ThemedText>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={18} color={colors.text.tertiary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('focus_search_placeholder')}
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

                {filteredApps.map(app => (
                    <TouchableOpacity
                        key={app.id}
                        style={styles.appRow}
                        onPress={() => toggleApp(app.id)}
                    >
                        <ThemedText variant="body">{app.name}</ThemedText>
                        <Switch
                            value={blockedApps.has(app.id)}
                            onValueChange={() => toggleApp(app.id)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.text.primary}
                        />
                    </TouchableOpacity>
                ))}

                {filteredApps.length === 0 && searchQuery.length > 0 && (
                    <ThemedText variant="body" color={colors.text.tertiary} style={{ textAlign: 'center', marginTop: 24 }}>
                        {t('focus_apps_no_match', { query: searchQuery })}
                    </ThemedText>
                )}

            </ScrollView>

            <View style={styles.footer}>
                <Button title={initialMode ? t('focus_save_btn') : t('focus_create_btn')} onPress={handleSave} variant="primary" style={{ width: '100%' }} />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: layout.spacing.m,
    },
    content: {
        paddingBottom: 100,
    },
    label: {
        marginTop: 24,
        marginBottom: 12,
    },
    input: {
        backgroundColor: colors.surface,
        color: colors.text.primary,
        padding: 16,
        borderRadius: layout.borderRadius.m,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconScroll: {
        flexDirection: 'row',
    },
    iconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectedIconBtn: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    appRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
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
});

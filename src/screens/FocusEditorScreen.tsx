import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { BookOpen, Briefcase, Moon, Zap, Smile, Heart, Star, Sun, Coffee, Music, X } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';

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

export const FocusEditorScreen = () => {
    const navigation = useNavigation();
    const route = useRoute(); // Need Route to get params
    const initialMode = route.params?.mode; // Check if editing

    const apps = useHushStore(state => state.apps);
    const addFocusMode = useHushStore(state => state.addFocusMode);
    const updateFocusMode = useHushStore(state => state.updateFocusMode);

    const [name, setName] = useState(initialMode?.name || '');
    const [selectedIcon, setSelectedIcon] = useState(initialMode?.icon || 'Smile');
    const [blockedApps, setBlockedApps] = useState<Set<string>>(new Set(initialMode?.blockedAppIds || []));

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
            alert('Please enter a name for your mode.');
            return;
        }

        const modeData = {
            name,
            description: `Custom mode with ${blockedApps.size} blocked apps`,
            icon: selectedIcon,
            blockedAppIds: Array.from(blockedApps)
        };

        if (initialMode) {
            updateFocusMode({ id: initialMode.id, ...modeData });
        } else {
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
                <ThemedText variant="header">{initialMode ? 'Edit Focus Mode' : 'Create Focus Mode'}</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Name Input */}
                <ThemedText variant="title" style={styles.label}>Mode Name</ThemedText>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Reading, Gym, Coding"
                    placeholderTextColor={colors.text.tertiary}
                />

                {/* Icon Picker */}
                <ThemedText variant="title" style={styles.label}>Select Icon</ThemedText>
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
                <ThemedText variant="title" style={styles.label}>Select Apps to Block</ThemedText>
                <ThemedText variant="caption" color={colors.text.tertiary} style={{ marginBottom: 16 }}>
                    Select the apps you want to MUTE when this mode is active.
                </ThemedText>

                {apps.map(app => (
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

            </ScrollView>

            <View style={styles.footer}>
                <Button title={initialMode ? "Save Changes" : "Create Mode"} onPress={handleSave} variant="primary" style={{ width: '100%' }} />
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
    }
});

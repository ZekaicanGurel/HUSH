import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { PremiumGateModal } from '../components/PremiumGateModal';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { BookOpen, Briefcase, Moon, Zap, Plus, Smile, Heart, Star, Sun, Coffee, Music, LayoutGrid, MoreVertical, Edit2, Trash2, X, Lock, Calendar } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { useNavigation } from '@react-navigation/native';
import { useFocusSuggestions } from '../hooks/useFocusSuggestions';
import { SuggestionCard } from '../components/SuggestionCard';
import { strings } from '../i18n/strings';
import * as Haptics from 'expo-haptics';

const ICON_MAP: Record<string, any> = {
    BookOpen, Briefcase, Moon, Zap, Smile, Heart, Star, Sun, Coffee, Music
};

export const FocusScreen = () => {
    const navigation = useNavigation();
    const focusModes = useHushStore(state => state.focusModes || []);
    const activeFocusModeId = useHushStore(state => state.activeFocusModeId);
    const setFocusMode = useHushStore(state => state.setFocusMode);
    const isPremium = useHushStore(state => state.isPremium);

    // AI Suggestions
    const suggestions = useFocusSuggestions();
    const topSuggestion = suggestions.length > 0 ? suggestions[0] : null;
    const dismissSuggestion = useHushStore(state => state.dismissSuggestion);

    const handleSuggestionAction = (suggestion: any) => {
        dismissSuggestion(suggestion.id);

        switch (suggestion.type) {
            case 'mode_recommendation':
                if (suggestion.data.modeId) {
                    setFocusMode(suggestion.data.modeId);
                    Alert.alert("Mode Activated", `${suggestion.data.modeName} is now active.`);
                }
                break;
            case 'schedule':
                (navigation as any).navigate('Schedules', {
                    create: true,
                    modeId: suggestion.data.modeId,
                    time: suggestion.data.time
                });
                break;
            case 'app_block':
                (navigation as any).navigate('FocusEditor');
                break;
        }
    };

    // Bottom Sheet State
    const [selectedMode, setSelectedMode] = React.useState<any>(null);
    const [modalVisible, setModalVisible] = React.useState(false);

    // Premium Gate Modal State
    const [premiumModalVisible, setPremiumModalVisible] = React.useState(false);
    const [premiumFeature, setPremiumFeature] = React.useState<'create' | 'edit' | 'delete'>('create');

    const showPremiumGate = (feature: 'create' | 'edit' | 'delete') => {
        setPremiumFeature(feature);
        setPremiumModalVisible(true);
    };

    const handleToggleMode = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Toggle is FREE for all users
        if (activeFocusModeId === id) {
            setFocusMode(null);
        } else {
            setFocusMode(id);
        }
    };

    const handleAddMode = () => {
        // Check how many custom modes user has
        const customModeCount = focusModes.filter(m => m.isCustom).length;

        // Free users can create 1 custom mode
        if (!isPremium && customModeCount >= 1) {
            showPremiumGate('create');
            return;
        }

        (navigation as any).navigate('FocusEditor');
    };

    const openMenu = (mode: any) => {
        setSelectedMode(mode);
        setModalVisible(true);
    };

    const closeMenu = () => {
        setModalVisible(false);
        setSelectedMode(null);
    };

    const handleEdit = () => {
        if (!isPremium) {
            closeMenu();
            showPremiumGate('edit');
            return;
        }

        if (selectedMode) {
            closeMenu();
            (navigation as any).navigate('FocusEditor', { mode: selectedMode });
        }
    };

    const handleDelete = () => {
        if (!isPremium) {
            closeMenu();
            showPremiumGate('delete');
            return;
        }

        if (selectedMode) {
            const isDefault = ['1', '2'].includes(selectedMode.id);
            if (isDefault) {
                Alert.alert("Default Modes", "Default modes cannot be deleted.");
                return;
            }

            Alert.alert(
                "Delete Mode",
                `Are you sure you want to delete "${selectedMode.name}"?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                            useHushStore.getState().removeFocusMode(selectedMode.id);
                            closeMenu();
                        }
                    }
                ]
            );
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.headerRow}>
                <ThemedText variant="header">{strings.focus_modes_header}</ThemedText>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={[styles.addButton, { marginRight: 8, backgroundColor: colors.surfaceHighlight }]}
                        onPress={() => (navigation as any).navigate('Schedules')}
                    >
                        <Calendar size={24} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addButton} onPress={handleAddMode}>
                        {!isPremium && (
                            <View style={styles.lockBadge}>
                                <Lock size={10} color={colors.background} />
                            </View>
                        )}
                        <Plus size={24} color={colors.background} />
                    </TouchableOpacity>
                </View>
            </View>

            {topSuggestion && (
                <View style={{ marginBottom: 16 }}>
                    <SuggestionCard
                        title={topSuggestion.title}
                        description={topSuggestion.description}
                        onAction={() => handleSuggestionAction(topSuggestion!)}
                        onDismiss={() => dismissSuggestion(topSuggestion!.id)}
                    />
                </View>
            )}

            <FlatList
                data={focusModes}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const Icon = ICON_MAP[item.icon] || LayoutGrid;
                    const isActive = activeFocusModeId === item.id;
                    // Show category count for preset modes, or app count for custom modes
                    const blockedCount = item.blockedCategories === 'ALL' ? 'All' :
                        (Array.isArray(item.blockedCategories) ? item.blockedCategories.length : 0) +
                        ((item.blockedApps || []).length);

                    return (
                        <TouchableOpacity
                            style={styles.cardContainer}
                            activeOpacity={0.9}
                            onPress={() => handleToggleMode(item.id)}
                        >
                            <Card style={[styles.modeCard, isActive && styles.activeCard]}>
                                <TouchableOpacity
                                    style={styles.menuButton}
                                    onPress={() => openMenu(item)}
                                >
                                    <MoreVertical size={16} color={isActive ? colors.background : colors.text.tertiary} />
                                </TouchableOpacity>

                                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                                    <Icon size={28} color={isActive ? colors.background : colors.primary} />
                                </View>
                                <ThemedText
                                    variant="title"
                                    style={[styles.modeTitle, isActive && { color: colors.background }]}
                                >
                                    {item.name}
                                </ThemedText>
                                <ThemedText variant="caption" center style={[styles.modeDesc, isActive && { color: 'rgba(15, 23, 42, 0.7)' }]}>
                                    {item.description || `${blockedCount} apps blocked`}
                                </ThemedText>
                                {isActive && (
                                    <View style={styles.activeBadge}>
                                        <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: '800', fontSize: 10 }}>ON</ThemedText>
                                    </View>
                                )}
                            </Card>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Mode Menu Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeMenu}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeMenu}>
                    <TouchableWithoutFeedback>
                        <View style={styles.bottomSheet}>
                            <View style={styles.sheetHeader}>
                                <ThemedText variant="title">Manage {selectedMode?.name}</ThemedText>
                                <TouchableOpacity onPress={closeMenu}>
                                    <X size={24} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.actionRow} onPress={handleEdit}>
                                <Edit2 size={20} color={colors.text.primary} style={{ marginRight: 16 }} />
                                <ThemedText variant="body">Edit Mode</ThemedText>
                                {!isPremium && (
                                    <View style={styles.premiumBadge}>
                                        <Lock size={12} color={colors.primary} />
                                        <ThemedText variant="caption" style={styles.premiumText}>Premium</ThemedText>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {selectedMode && !['1', '2'].includes(selectedMode.id) && (
                                <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
                                    <Trash2 size={20} color={colors.status.error} style={{ marginRight: 16 }} />
                                    <ThemedText variant="body" style={{ color: colors.status.error }}>Delete Mode</ThemedText>
                                    {!isPremium && (
                                        <View style={styles.premiumBadge}>
                                            <Lock size={12} color={colors.primary} />
                                            <ThemedText variant="caption" style={styles.premiumText}>Premium</ThemedText>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* Premium Gate Modal */}
            <PremiumGateModal
                visible={premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                feature={premiumFeature}
            />
        </ScreenWrapper >
    );
};

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: layout.spacing.m,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    lockBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.status.warning,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    listContent: {
        paddingBottom: layout.spacing.xxl,
        paddingTop: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: '48%',
        marginBottom: layout.spacing.m,
    },
    modeCard: {
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
    },
    activeCard: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    iconContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(94, 234, 212, 0.1)',
    },
    activeIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    modeTitle: {
        marginBottom: 4,
        fontSize: 16,
        textAlign: 'center',
    },
    activeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    modeDesc: {
        color: colors.text.tertiary,
        fontSize: 12,
        paddingHorizontal: 4,
        lineHeight: 16,
    },
    menuButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        padding: 8,
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 48,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: 'rgba(94, 234, 212, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    premiumText: {
        color: colors.primary,
        marginLeft: 4,
        fontWeight: '600',
    },
});

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { BookOpen, Briefcase, Moon, Zap, Plus, Smile, Heart, Star, Sun, Coffee, Music, LayoutGrid, MoreVertical, Edit2, Trash2, X } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { useNavigation } from '@react-navigation/native';

const ICON_MAP: Record<string, any> = {
    BookOpen, Briefcase, Moon, Zap, Smile, Heart, Star, Sun, Coffee, Music
};

export const FocusScreen = () => {
    const navigation = useNavigation();
    const focusModes = useHushStore(state => state.focusModes);
    const activeFocusModeId = useHushStore(state => state.activeFocusModeId);
    const setFocusMode = useHushStore(state => state.setFocusMode);

    // Bottom Sheet State
    const [selectedMode, setSelectedMode] = React.useState<any>(null);
    const [modalVisible, setModalVisible] = React.useState(false);

    const handleToggleMode = (id: string, name: string) => {
        if (activeFocusModeId === id) {
            setFocusMode(null); // Deactivate
        } else {
            setFocusMode(id); // Activate
        }
    };

    const handleAddMode = () => {
        navigation.navigate('FocusEditor' as never);
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
        if (selectedMode) {
            closeMenu();
            navigation.navigate('FocusEditor' as never, { mode: selectedMode });
        }
    };

    const handleDelete = () => {
        if (selectedMode) {
            const isDefault = ['1', '2', '3', '4'].includes(selectedMode.id);
            if (isDefault) {
                alert("Default modes cannot be deleted.");
                return;
            }

            // Confirm Delete
            const { Alert } = require('react-native');
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
                <ThemedText variant="header">Focus Modes</ThemedText>
                <TouchableOpacity style={styles.addButton} onPress={handleAddMode}>
                    <Plus size={24} color={colors.background} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={focusModes}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const Icon = ICON_MAP[item.icon] || LayoutGrid;
                    const isActive = activeFocusModeId === item.id;
                    const blockedCount = item.blockedAppIds ? item.blockedAppIds.length : 0;

                    return (
                        <TouchableOpacity
                            style={styles.cardContainer}
                            activeOpacity={0.9}
                            onPress={() => handleToggleMode(item.id, item.name)}
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

            {/* Custom Bottom Sheet Modal */}
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
                            </TouchableOpacity>

                            {selectedMode && !['1', '2', '3', '4'].includes(selectedMode.id) && (
                                <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
                                    <Trash2 size={20} color={colors.status.error} style={{ marginRight: 16 }} />
                                    <ThemedText variant="body" style={{ color: colors.status.error }}>Delete Mode</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </ScreenWrapper>
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
        aspectRatio: 1, // Square cards
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24, // Even softer
    },
    activeCard: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    iconContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(94, 234, 212, 0.1)', // Soft Teal Tint
    },
    activeIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // White tint for active
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
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker dim
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32, // More rounded sheet
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
    }
});

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { PremiumGateModal } from '../components/PremiumGateModal';
import { Plus, Clock, Calendar, Check, X, Trash2, Power, ChevronLeft } from 'lucide-react-native';
import { useHushStore, FocusModeSchedule } from '../store/useHushStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useI18nStore } from '../i18n';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SchedulesScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { t } = useI18nStore();
    const schedules = useHushStore(state => state.focusSchedules || []);
    const addSchedule = useHushStore(state => state.addSchedule);
    const updateSchedule = useHushStore(state => state.updateSchedule);
    const deleteSchedule = useHushStore(state => state.deleteSchedule);
    const focusModes = useHushStore(state => state.focusModes || []);
    const isPremium = useHushStore(state => state.isPremium);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [premiumModalVisible, setPremiumModalVisible] = useState(false);

    // Form State
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
    const [selectedModeId, setSelectedModeId] = useState<string>('1'); // Default to Deep Focus (usually)

    React.useEffect(() => {
        if (route.params?.create) {
            setEditingId(null);
            if (route.params.time) {
                setStartTime(route.params.time);
                // Default duration 1 hour? Or calculated?
                // Let's assume 1 hour later for endTime basics
                const [h, m] = route.params.time.split(':').map(Number);
                const endH = (h + 1) % 24;
                setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
            if (route.params.modeId) {
                setSelectedModeId(route.params.modeId);
            }
            setModalVisible(true);
            // Clear params to avoid reopening on re-focus?
            navigation.setParams({ create: undefined } as any);
        }
    }, [route.params]);

    const handleEdit = (schedule: FocusModeSchedule) => {
        setEditingId(schedule.id);
        setStartTime(schedule.startTime);
        setEndTime(schedule.endTime);
        setSelectedDays(schedule.days);
        setSelectedModeId(schedule.modeId);
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setStartTime('09:00');
        setEndTime('17:00');
        setSelectedDays([1, 2, 3, 4, 5]);
        setSelectedModeId(focusModes[0]?.id || '1');
        setModalVisible(true);
    };

    const handleSave = () => {
        // Validation
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            Alert.alert(t('sched_invalid_time'), t('sched_invalid_time_msg'));
            return;
        }

        // Premium Check: Free users limited to 1 schedule
        if (!editingId && !isPremium && schedules.length >= 1) {
            setModalVisible(false); // Close form
            setTimeout(() => setPremiumModalVisible(true), 300); // Small delay to allow modal close
            return;
        }

        const mode = focusModes.find(m => m.id === selectedModeId);
        const modeName = mode ? mode.name : 'Unknown Mode';

        if (editingId) {
            updateSchedule({
                id: editingId,
                modeId: selectedModeId,
                modeName,
                startTime,
                endTime,
                days: selectedDays,
                enabled: true
            });
        } else {
            addSchedule({
                modeId: selectedModeId,
                modeName,
                startTime,
                endTime,
                days: selectedDays,
                enabled: true
            });
        }
        setModalVisible(false);
    };

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(selectedDays.filter(d => d !== dayIndex));
        } else {
            setSelectedDays([...selectedDays, dayIndex].sort());
        }
    };

    const renderScheduleItem = ({ item }: { item: FocusModeSchedule }) => (
        <Card style={styles.scheduleCard}>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <ThemedText variant="subheader" style={{ fontWeight: 'bold' }}>{item.modeName}</ThemedText>
                    <View style={styles.timeRow}>
                        <Clock size={14} color={colors.text.tertiary} />
                        <ThemedText variant="caption" color={colors.text.secondary} style={{ marginLeft: 6 }}>
                            {item.startTime} - {item.endTime}
                        </ThemedText>
                    </View>
                    <View style={styles.daysRow}>
                        {DAYS.map((day, index) => (
                            <ThemedText
                                key={index}
                                variant="caption"
                                style={[
                                    styles.dayText,
                                    item.days.includes(index) ? { color: colors.primary, fontWeight: 'bold' } : { color: colors.text.tertiary, opacity: 0.5 }
                                ]}
                            >
                                {day.charAt(0)}
                            </ThemedText>
                        ))}
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => updateSchedule({ ...item, enabled: !item.enabled })}>
                        <Power size={20} color={item.enabled ? colors.primary : colors.text.tertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginLeft: 16 }}>
                        <Clock size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSchedule(item.id)} style={{ marginLeft: 16 }}>
                        <Trash2 size={20} color={colors.status.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.text.primary} size={28} />
                </TouchableOpacity>
                <ThemedText variant="header">{t('sched_title')}</ThemedText>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={schedules}
                renderItem={renderScheduleItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Calendar size={48} color={colors.text.tertiary} />
                        <ThemedText variant="body" color={colors.text.secondary} style={{ marginTop: 16 }}>
                            {t('sched_empty')}
                        </ThemedText>
                        <ThemedText variant="caption" color={colors.text.tertiary} style={{ textAlign: 'center', marginTop: 8 }}>
                            {t('sched_empty_desc')}
                        </ThemedText>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleCreate}>
                <Plus color="white" size={24} />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ThemedText variant="header" style={{ marginBottom: 20 }}>
                            {editingId ? t('sched_edit') : t('sched_new')}
                        </ThemedText>

                        <ThemedText variant="caption" color={colors.text.secondary} style={styles.label}>{t('sched_mode_label')}</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeSelector}>
                            {focusModes.map(mode => (
                                <TouchableOpacity
                                    key={mode.id}
                                    style={[
                                        styles.modeChip,
                                        selectedModeId === mode.id && styles.modeChipActive
                                    ]}
                                    onPress={() => setSelectedModeId(mode.id)}
                                >
                                    <ThemedText style={{ color: selectedModeId === mode.id ? 'white' : colors.text.primary }}>
                                        {mode.name}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.timeInputsRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <ThemedText variant="caption" color={colors.text.secondary} style={styles.label}>{t('sched_start_label')}</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="HH:mm"
                                    placeholderTextColor={colors.text.tertiary}
                                    keyboardType="numbers-and-punctuation"
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <ThemedText variant="caption" color={colors.text.secondary} style={styles.label}>{t('sched_end_label')}</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    placeholder="HH:mm"
                                    placeholderTextColor={colors.text.tertiary}
                                    keyboardType="numbers-and-punctuation"
                                />
                            </View>
                        </View>



                        <ThemedText variant="caption" color={colors.text.secondary} style={styles.label}>{t('sched_days_label')}</ThemedText>
                        <View style={styles.daysSelector}>
                            {DAYS.map((day, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayChip,
                                        selectedDays.includes(index) && styles.dayChipActive
                                    ]}
                                    onPress={() => toggleDay(index)}
                                >
                                    <ThemedText style={{ color: selectedDays.includes(index) ? 'white' : colors.text.secondary, fontSize: 12 }}>
                                        {day.charAt(0)}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <ThemedText color={colors.text.secondary}>{t('cancel')}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <ThemedText style={{ fontWeight: 'bold', color: 'black' }}>{t('save')}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <PremiumGateModal
                visible={premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                feature="create"
            />
        </ScreenWrapper >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    backButton: {
        padding: 4,
    },
    scheduleCard: {
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    daysRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 6,
    },
    dayText: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        opacity: 0.7,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end', // Bottom sheet style
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
    },
    label: {
        marginBottom: 8,
        marginTop: 16,
    },
    modeSelector: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    modeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    timeInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    input: {
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 12,
        color: colors.text.primary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    daysSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    dayChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 32,
        marginBottom: 16,
    },
    cancelButton: {
        padding: 16,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 16,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
});

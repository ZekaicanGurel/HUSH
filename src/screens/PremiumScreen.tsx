import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { Check, Crown, X, Shield, Zap, TrendingUp } from 'lucide-react-native';
import { useHushStore } from '../store/useHushStore';
import { useNavigation } from '@react-navigation/native';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { useI18nStore } from '../i18n';

export const PremiumScreen = () => {
    const navigation = useNavigation();
    const { t } = useI18nStore();
    const { restorePurchases, offerings } = useRevenueCat();
    const isPremium = useHushStore(state => state.isPremium);

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (offerings && offerings.availablePackages) {
            setPackages(offerings.availablePackages);
            setLoading(false);
        }
    }, [offerings]);

    const handlePurchase = async () => {
        if (!selectedPackage) return;



        setPurchasing(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
            // The store listener in App.tsx or useRevenueCat should update global state isPremium
            // If strictly needed we might manually set it or wait for listener
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert(t('premium_error'), e.message);
            }
        } finally {
            setPurchasing(false);
        }
    };





    // Success State
    if (isPremium && !loading) {
        return (
            <ScreenWrapper center>
                <View style={{ alignItems: 'center', padding: 32 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 20, shadowColor: colors.primary, shadowRadius: 20 }}>
                        <Crown size={40} color={colors.background} />
                    </View>
                    <ThemedText variant="header" center style={{ marginBottom: 8 }}>{t('premium_congrats')}</ThemedText>
                    <ThemedText variant="body" center color={colors.text.secondary} style={{ marginBottom: 32 }}>
                        {t('premium_congrats_desc')}
                    </ThemedText>
                    <Button
                        title="Continue"
                        onPress={() => navigation.goBack()}
                        variant="primary"
                        style={{ width: 200 }}
                    />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper style={{ paddingHorizontal: 0 }}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 60 }}>
                {/* Header */}
                <View style={styles.header}>
                    <Crown size={48} color={colors.primary} style={{ marginBottom: 16 }} />
                    <ThemedText variant="header" center style={{ fontSize: 28 }}>{t('premium_title')}</ThemedText>
                    <ThemedText variant="body" center color={colors.text.secondary} style={{ marginTop: 8, paddingHorizontal: 32 }}>
                        {t('premium_subtitle')}
                    </ThemedText>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <FeatureItem icon={Shield} text={t('premium_feature_1')} />
                    <FeatureItem icon={Zap} text={t('premium_feature_2')} />
                    <FeatureItem icon={TrendingUp} text={t('premium_feature_3')} />
                </View>

                {/* Packages */}
                <View style={styles.packagesContainer}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                        packages.map((pkg) => {
                            const isSelected = selectedPackage?.identifier === pkg.identifier;
                            const isLifetime = pkg.packageType === 'LIFETIME';

                            return (
                                <TouchableOpacity
                                    key={pkg.identifier}
                                    style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                                    onPress={() => setSelectedPackage(pkg)}
                                    activeOpacity={0.8}
                                >
                                    {isLifetime && (
                                        <View style={styles.bestValueBadge}>
                                            <ThemedText style={styles.bestValueText}>{t('premium_best_value')}</ThemedText>
                                        </View>
                                    )}

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <ThemedText variant="body" style={{ fontWeight: 'bold', color: isSelected ? colors.primary : colors.text.primary }}>
                                                {pkg.product.title}
                                            </ThemedText>
                                            {isLifetime && (
                                                <ThemedText variant="caption" style={{ color: colors.status.success, fontSize: 10 }}>
                                                    {t('premium_save_percent', { percent: 45 })}
                                                </ThemedText>
                                            )}
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <ThemedText variant="body" style={{ fontWeight: 'bold' }}>{pkg.product.priceString}</ThemedText>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Footer Terms */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                    <TouchableOpacity style={{ marginHorizontal: 12 }}>
                        <ThemedText variant="caption" color={colors.text.tertiary}>{t('premium_terms')}</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginHorizontal: 12 }}>
                        <ThemedText variant="caption" color={colors.text.tertiary}>{t('premium_privacy')}</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <Button
                    title={purchasing ? t('premium_processing') : t('premium_cta')}
                    onPress={handlePurchase}
                    variant="primary"
                    disabled={purchasing || loading}
                    style={{ width: '100%' }}
                />
                <TouchableOpacity onPress={restorePurchases} style={{ marginTop: 16 }}>
                    <ThemedText variant="caption" center color={colors.text.secondary}>{t('premium_restore')}</ThemedText>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const FeatureItem = ({ icon: Icon, text }: any) => (
    <View style={styles.featureItem}>
        <View style={styles.checkCircle}>
            <Check size={14} color={colors.background} />
        </View>
        <ThemedText variant="body" style={{ marginLeft: 12, fontWeight: '500' }}>{text}</ThemedText>
    </View>
);

const styles = StyleSheet.create({
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    features: {
        paddingHorizontal: 40,
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packagesContainer: {
        paddingHorizontal: 24,
    },
    packageCard: {
        backgroundColor: colors.surface,
        borderRadius: 20, // Soften
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    packageCardSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(94, 234, 212, 0.05)', // Match new Teal primary
    },
    bestValueBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: colors.primary,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    bestValueText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.background,
    },
    bottomBar: {
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

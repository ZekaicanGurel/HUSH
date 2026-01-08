import React from 'react';
import { View, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    fullScreen?: boolean; // if true, ignores safe area (useful for splash)
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    style,
    fullScreen = false
}) => {
    const insets = useSafeAreaInsets();

    const containerStyle = [
        styles.container,
        {
            paddingTop: fullScreen ? 0 : insets.top,
            paddingBottom: fullScreen ? 0 : insets.bottom,
            paddingLeft: fullScreen ? 0 : insets.left + layout.screenPadding,
            paddingRight: fullScreen ? 0 : insets.right + layout.screenPadding,
        },
        style
    ];

    return (
        <View style={styles.background}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <View style={containerStyle}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
});

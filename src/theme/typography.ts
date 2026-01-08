import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
    header: {
        fontSize: 32,
        fontWeight: '700' as TextStyle['fontWeight'],
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    subheader: {
        fontSize: 24,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.text.primary,
        letterSpacing: -0.3,
    },
    title: {
        fontSize: 20,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.text.primary,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as TextStyle['fontWeight'],
        color: colors.text.secondary,
        lineHeight: 24,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as TextStyle['fontWeight'],
        color: colors.text.tertiary,
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.background,
    },
};

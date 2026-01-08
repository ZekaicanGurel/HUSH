import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

interface ThemedTextProps extends TextProps {
    variant?: keyof typeof typography;
    color?: string;
    center?: boolean;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
    style,
    variant = 'body',
    color,
    center,
    children,
    ...props
}) => {
    return (
        <Text
            style={[
                typography[variant],
                color && { color },
                center && { textAlign: 'center' },
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
};

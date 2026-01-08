import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/colors';
import { Home, BarChart2, Moon, Settings, Smartphone } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.text.secondary,
                tabBarShowLabel: false, // Minimalist look
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Insights" // This is now the Apps list
                component={InsightsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Smartphone color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Analytics" // New Graphs Tab
                component={AnalyticsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Focus"
                component={FocusScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Moon color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

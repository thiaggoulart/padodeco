import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { colors } from '../utils/colors';

export default function RootLayout() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerTintColor: colors.primary,
                    headerTitleStyle: { color: colors.text, fontWeight: '800' },
                }}
            />
        </SafeAreaView>
    );
}

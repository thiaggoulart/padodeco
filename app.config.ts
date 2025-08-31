import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
    name: 'padodeco',
    slug: 'padodeco',
    scheme: 'padodeco',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/logo.png',
    splash: {
        image: './assets/logo.png',
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
    },
    ios: {
        supportsTablet: false,
        bundleIdentifier: 'com.seu.bundle.padodeco',
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/logo.png',
            backgroundColor: '#FFFFFF',
        },
        package: 'com.seu.bundle.padodeco',
    },
    extra: {
    },
    assetBundlePatterns: ['**/*'],
};

export default config;

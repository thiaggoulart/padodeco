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
        icon: './assets/logo.png',
        buildNumber: '1',
    },

    android: {
        package: 'com.seu.bundle.padodeco',
        versionCode: 1,
        adaptiveIcon: {
            foregroundImage: './assets/logo.png',
            backgroundColor: '#FFFFFF',
        },
    },

    extra: {
        eas: { projectId: 'cbc2fba2-a506-4a3f-a94e-254fa19a9adb' },
    },

    assetBundlePatterns: ['**/*'],
};

export default config;

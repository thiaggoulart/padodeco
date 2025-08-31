import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../utils/colors';

type Tone = { bg?: string; fg?: string; border?: string };
type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  tone?: Tone;
};

export default function Button({ title, onPress, loading, disabled, variant = 'primary', tone }: Props) {
  const bg = variant === 'primary' ? (tone?.bg ?? colors.primary) : colors.card;
  const border = variant === 'ghost' ? (tone?.bg ?? colors.primary) : 'transparent';
  const fg = variant === 'primary' ? (tone?.fg ?? colors.onPrimary) : (tone?.bg ?? colors.primary);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        paddingVertical: 12, paddingHorizontal: 18,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: border,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <Text style={{ color: fg, fontWeight: '800', textAlign: 'center', fontSize: 16 }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

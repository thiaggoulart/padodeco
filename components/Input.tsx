import React, { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { g } from '../styles/global';
import { colors } from '../utils/colors';

export default function Input(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      style={[
        g.input,
        focused && {
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        props.style,
      ]}
      placeholderTextColor={colors.muted}
      selectionColor={colors.primary}
      keyboardAppearance="light"
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

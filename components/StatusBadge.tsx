// components/StatusBadge.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { STATUS_LABEL, STATUS_TONE, type ServiceStatus } from '../utils/status';

export default function StatusBadge({ status }: { status?: ServiceStatus | null }) {
  if (!status) return null;
  const tone = STATUS_TONE[status];
  const label = STATUS_LABEL[status];
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: tone.bg }}>
      <Text style={{ color: tone.fg, fontWeight: '700', letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
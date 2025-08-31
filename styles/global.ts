// styles/global.ts
import { StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

export const g = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: colors.bg },
  brandText: { fontSize: 20, fontWeight: '800', color: colors.text },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.label, marginTop: 6 },
  text: { fontSize: 16, color: colors.text },

  input: {
    borderWidth: 2,
    borderColor: colors.outline,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
    color: colors.text,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.outline,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  toast: {
    position: 'absolute', left: 16, right: 16, bottom: 16,
    padding: 12, borderRadius: 12, backgroundColor: colors.primary,
  },
  toastText: { color: colors.onPrimary, textAlign: 'center', fontWeight: '700' },
});

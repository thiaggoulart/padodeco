import { Alert } from 'react-native';
export const toast = (title: string, msg?: string) => Alert.alert(title, msg);

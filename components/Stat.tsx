import { View, Text, StyleSheet } from 'react-native';
import { C } from '../data/colors';

type Props = { label: string; value: string };

export default function Stat({ label, value }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  label: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  value: { fontSize: 13, fontWeight: '500', color: C.text },
});

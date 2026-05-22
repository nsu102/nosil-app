import { View, Text, StyleSheet } from 'react-native';
import { C } from '../data/colors';

type Props = { title: string; children: React.ReactNode };

export default function Section({ title, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  title: { fontSize: 13, fontWeight: '500', color: C.textMuted, marginBottom: 10 },
});

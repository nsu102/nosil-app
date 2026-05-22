import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import AppShell from '../components/AppShell';

type CardProps = {
  label: string;
  title: string;
  korean: string;
  onPress: () => void;
  big?: boolean;
  tall?: boolean;
};

function Card({ label, title, korean, onPress, big, tall }: CardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { minHeight: big ? 120 : tall ? 106 : 96, padding: big ? 18 : 14, paddingTop: big ? 20 : 16 }]}
    >
      <Text style={styles.cardLabel}>{label}</Text>
      <View>
        <Text style={[styles.cardTitle, { fontSize: big ? 24 : 19, lineHeight: big ? 27.6 : 21.85 }]}>{title}</Text>
        <Text style={styles.cardKorean}>{korean}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <AppShell currentPage="home">
      <View style={styles.hero}>
        <Image source={require('../assets/home-logo.png')} style={styles.heroLogo} resizeMode="contain" />
        <Text style={styles.skinAtelier}>SKIN ATELIER</Text>
        <Text style={styles.heroTitle}>{'A Quiet Ritual\nfor Your Skin'}</Text>
        <Text style={styles.heroSub}>정답이 아닌, 당신의 결을 찾는 조용한 시간</Text>
      </View>

      <View>
        <View style={styles.row2}>
          <View style={[styles.cellBorder, { flex: 1 }]}>
            <Card big label="01 Diagnose" title="Treatment" korean="시술 추천받기" onPress={() => router.push('/recommend')} />
          </View>
          <View style={{ flex: 1 }}>
            <Card big label="02 Discover" title="Atelier List" korean="NO실장 병원" onPress={() => router.push('/hospitals')} />
          </View>
        </View>
        <View style={styles.row3}>
          <View style={[styles.cellBorder, { flex: 1 }]}>
            <Card tall label="03" title="Library" korean="시술 백과" onPress={() => router.push('/encyclopedia')} />
          </View>
          <View style={[styles.cellBorder, { flex: 1 }]}>
            <Card tall label="04" title="Daily" korean="데일리 스킨 리스트" onPress={() => router.push('/daily')} />
          </View>
          <View style={{ flex: 1 }}>
            <Card tall label="05" title="Manager" korean="스킨 매니저" onPress={() => router.push('/record')} />
          </View>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderStrong,
  },
  heroLogo: {
    width: 160,
    height: 92,
    marginBottom: 18,
  },
  skinAtelier: {
    fontSize: 9,
    letterSpacing: 2.7,
    color: C.accent,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: F.sansMedium,
  },
  heroTitle: {
    fontFamily: F.serifLight,
    fontSize: 24,
    lineHeight: 28.8,
    color: C.text,
    letterSpacing: -0.12,
    textAlign: 'center',
  },
  heroSub: {
    marginTop: 14,
    maxWidth: 280,
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 17.6,
    letterSpacing: 0.11,
    textAlign: 'center',
  },
  row2: { flexDirection: 'row' },
  row3: { flexDirection: 'row' },
  cellBorder: { borderRightWidth: 0.5, borderRightColor: C.borderStrong },
  card: {
    backgroundColor: C.card,
    borderTopWidth: 0.5,
    borderTopColor: C.borderStrong,
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 9,
    letterSpacing: 2.25,
    color: C.accent,
    textTransform: 'uppercase',
    fontFamily: F.sansMedium,
  },
  cardTitle: {
    fontFamily: F.serifRegular,
    color: C.text,
    letterSpacing: -0.19,
    marginBottom: 5,
  },
  cardKorean: {
    fontSize: 10.5,
    color: C.textMuted,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
});

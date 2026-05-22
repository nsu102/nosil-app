import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C, TREATMENT_COLORS } from '../data/colors';
import { Treatment } from '../data/treatments';
import { DOSAGE_GUIDE } from '../data/dosage';
import { BOTOX_BRANDS } from '../data/botox-brands';
import Stat from './Stat';
import Section from './Section';
import { Ionicons } from '@expo/vector-icons';

type Props = { treatment: Treatment; onBack: () => void };

export default function TreatmentDetail({ treatment: t, onBack }: Props) {
  const isBotox = t.category === 'botox';
  const dosage = DOSAGE_GUIDE[t.name];
  const color = TREATMENT_COLORS[t.name] || C.accent;
  const painColor = t.pain >= 7 ? '#D45B7B' : t.pain >= 4 ? '#E0A558' : '#88C29B';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={14} color={C.textMuted} />
        <Text style={styles.backText}>목록으로</Text>
      </TouchableOpacity>

      <View style={styles.nameRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.name}>{t.name}</Text>
      </View>
      {t.spec ? <Text style={styles.spec}>{t.spec}</Text> : null}
      <Text style={styles.desc}>{t.desc}</Text>

      <View style={styles.statGrid}>
        <Stat label="권장 횟수" value={t.sessions} />
        <Stat label="유지 기간" value={t.duration} />
        <Stat label="다음 시술까지" value={t.interval + '주 후'} />
        <Stat label="다운타임" value={t.downtime} />
      </View>

      <Section title="주요 효과">
        <Text style={styles.bodyText}>{t.effect}</Text>
      </Section>

      {dosage && (
        <Section title="권장 용량/횟수">
          <View style={styles.dosageCard}>
            <View style={styles.dosageHeader}>
              <View style={[styles.dosageHeaderCell, styles.dosageHeaderLeft]}>
                <Text style={styles.dosageHeaderTextMuted}>이벤트 기준</Text>
              </View>
              <View style={[styles.dosageHeaderCell, styles.dosageHeaderRight]}>
                <Text style={styles.dosageHeaderTextAccent}>평균 체감 기준</Text>
              </View>
            </View>
            <View style={styles.dosageBody}>
              <View style={[styles.dosageCell, styles.dosageCellLeft]}>
                <Text style={styles.dosageValueMuted}>{dosage.event}</Text>
              </View>
              <View style={styles.dosageCell}>
                <Text style={styles.dosageValue}>{dosage.recommended}</Text>
              </View>
            </View>
          </View>
          <View style={styles.dosageNote}>
            <Text style={styles.dosageNoteText}>
              병원 이벤트가는 효과를 체감하기엔 부족한 양일 수 있어요. 평균 체감 기준은 효과를 보려는 사람들이 받는 평균치예요.
            </Text>
          </View>
        </Section>
      )}

      <Section title="고려 가능한 고민">
        <View style={styles.chipWrap}>
          {t.concerns.map((c, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="통증 정도">
        <View style={styles.painRow}>
          <View style={styles.painBar}>
            <View style={[styles.painFill, { width: `${t.pain * 10}%` as `${number}%`, backgroundColor: painColor }]} />
          </View>
          <Text style={styles.painText}>{t.pain}/10</Text>
        </View>
      </Section>

      {t.tips && t.tips.length > 0 && (
        <Section title="팁 종류 (의사와 상담 후 결정해요)">
          {t.tips.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipName}>{tip.name}</Text>
              <Text style={styles.tipTarget}>{tip.target}</Text>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
            </View>
          ))}
        </Section>
      )}

      {isBotox && (
        <Section title="약물 종류 (의사와 상담 후 결정해요)">
          {BOTOX_BRANDS.map((b, i) => (
            <View key={i} style={styles.tipCard}>
              <View style={styles.brandRow}>
                <Text style={styles.tipName}>{b.name}</Text>
                <Text style={styles.brandMaker}>{b.maker}</Text>
              </View>
              <Text style={styles.tipDesc}>{b.desc}</Text>
            </View>
          ))}
        </Section>
      )}

      {t.aftercare ? (
        <Section title="시술 후 관리">
          <View style={styles.successBox}>
            <Text style={styles.successText}>{t.aftercare}</Text>
          </View>
        </Section>
      ) : null}

      {t.avoid_act ? (
        <Section title="피해야 할 행동">
          <View style={styles.dangerBox}>
            <Text style={styles.dangerText}>{t.avoid_act}</Text>
          </View>
        </Section>
      ) : null}

      <Section title="같이하면 좋은 조합">
        <View style={styles.successBox}>
          <Text style={styles.successText}>{t.good.join(', ')}</Text>
        </View>
      </Section>

      <Section title="동일일자 진행은 주의가 필요한 시술">
        <View style={styles.dangerBox}>
          <Text style={styles.dangerText}>{t.avoid.join(', ')}</Text>
        </View>
      </Section>

      <Section title="주의사항">
        <View style={styles.cautionBox}>
          <Text style={styles.bodyText}>{t.caution}</Text>
        </View>
      </Section>

      <Section title="평균 가격">
        <View style={styles.priceCard}>
          <Text style={styles.priceMain}>{t.price}</Text>
          <Text style={styles.priceRange}>현실 가격대 {t.range}</Text>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 4, paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, marginBottom: 0 },
  backText: { fontSize: 12, color: C.textMuted },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontSize: 22, fontWeight: '500', color: C.text },
  spec: { fontSize: 11, color: C.accent, fontWeight: '500', marginTop: 4 },
  desc: { fontSize: 13, color: C.text, lineHeight: 22.1, marginTop: 14, marginBottom: 20 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  bodyText: { fontSize: 13, color: C.text, lineHeight: 20.8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 11, paddingVertical: 5, backgroundColor: C.soft, borderRadius: 999 },
  chipText: { fontSize: 12, color: C.text },
  painRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  painBar: { flex: 1, height: 6, backgroundColor: C.soft, borderRadius: 999, overflow: 'hidden' },
  painFill: { height: '100%' },
  painText: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  tipCard: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  tipName: { fontSize: 13, fontWeight: '500', color: C.text, marginBottom: 4 },
  tipTarget: { fontSize: 11, color: C.accent, marginBottom: 6, fontWeight: '500' },
  tipDesc: { fontSize: 12, color: C.textMuted, lineHeight: 18.6 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  brandMaker: { fontSize: 10, color: C.textMuted },
  successBox: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.successBg, borderRadius: 12 },
  successText: { fontSize: 13, color: C.success, lineHeight: 21 },
  dangerBox: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.dangerBg, borderRadius: 12 },
  dangerText: { fontSize: 13, color: C.danger, lineHeight: 21 },
  cautionBox: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.soft, borderRadius: 12 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', padding: 16, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12 },
  priceMain: { fontSize: 18, fontWeight: '500', color: C.text },
  priceRange: { fontSize: 12, color: C.textMuted },
  dosageCard: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  dosageHeader: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  dosageHeaderCell: { flex: 1, padding: 10, alignItems: 'center' },
  dosageHeaderLeft: { backgroundColor: C.soft, borderRightWidth: 0.5, borderRightColor: C.border },
  dosageHeaderRight: { backgroundColor: C.accentBg },
  dosageHeaderTextMuted: { fontSize: 11, color: C.textMuted, textAlign: 'center' },
  dosageHeaderTextAccent: { fontSize: 11, color: C.accent, fontWeight: '500', textAlign: 'center' },
  dosageBody: { flexDirection: 'row' },
  dosageCell: { flex: 1, padding: 14, alignItems: 'center' },
  dosageCellLeft: { borderRightWidth: 0.5, borderRightColor: C.border },
  dosageValueMuted: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  dosageValue: { fontSize: 13, color: C.text, fontWeight: '500' },
  dosageNote: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.soft, borderRadius: 8 },
  dosageNoteText: { fontSize: 11, color: C.textMuted, lineHeight: 17.05 },
});

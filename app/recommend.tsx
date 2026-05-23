import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { C } from '../data/colors';
import { Treatment } from '../data/treatments';
import { useData } from '../contexts/DataContext';
import ConcernRadar from '../components/ConcernRadar';
import AppShell, { SubHeader } from '../components/AppShell';
import TreatmentDetailScreen from '../components/TreatmentDetail';
import { TREATMENT_COLORS } from '../data/colors';
import { F } from '../data/fonts';
import Spinner from '../components/Spinner';
import { useUserId } from '../hooks/useUserId'; // TODO: 추후 로그인 로직으로 변경
import { supabase } from '../lib/supabase';

const ANALYSIS_LOADING_MESSAGES = [
  'AI가 0.1mm 단위로 모공과 요철을 정밀 스캔하고 있어요.',
  '수만 장의 임상 데이터를 바탕으로 당신의 피부를 대조 분석 중입니다.',
  '가장 정확한 시술 권장량을 계산하기 위해 데이터를 꼼꼼히 살피고 있어요.',
  "빛의 각도와 그림자를 제외한 '진짜 피부 상태'를 찾아내고 있습니다.",
  '지금 AI가 실장님보다 훨씬 꼼꼼하게 당신의 시술 조합을 짜고 있어요.',
  'AI가 열일 중입니다. 상담실장님 몰래 분석하고 올게요!',
  '피부 고수로 가는 길, 10초만 더 기다려주세요.',
  '알고 계셨나요? 리쥬란은 손주사로 맞을 때 엠보싱이 생겨야 정량이에요.',
  '팁: 포텐자와 제모를 같은 날 하는 건 피부에 큰 자극이 될 수 있어요!',
  '시술 전, 오늘 찍은 이 사진을 잘 저장해두세요. 전후 비교의 기준이 됩니다.',
  "잠깐! 오늘 분석 결과가 나오면, 본인에게 맞는 '평균 시술가'를 꼭 확인해보세요.",
];

const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';

type AnalysisResult = {
  concerns: string[];
  concern_levels: Record<string, number>;
  primary: string[];
  secondary: string[];
  good_combo: string;
  caution_combo: string;
  needs_consult: string[];
  summary: string;
};

function normalizeAnalysisResult(parsed: AnalysisResult): AnalysisResult {
  const levels = parsed.concern_levels || {};
  const merged = Array.from(new Set([...(parsed.concerns || []), ...Object.keys(levels)]))
    .map((name) => ({
      name,
      level: typeof levels[name] === 'number' ? levels[name] : 0,
    }))
    .filter((item) => item.level > 0 || item.name)
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));

  return {
    ...parsed,
    concerns: merged.map((item) => item.name),
    concern_levels: merged.reduce<Record<string, number>>((acc, item) => {
      acc[item.name] = item.level;
      return acc;
    }, {}),
  };
}

function TreatmentChip({
  name,
  primary,
  onPress,
}: {
  name: string;
  primary?: boolean;
  onPress: () => void;
}) {
  const { getTreatment } = useData();
  const treatment = getTreatment(name);
  const color = TREATMENT_COLORS[name] || C.accent;

  return (
    <TouchableOpacity onPress={onPress} style={styles.treatmentChip}>
      <View style={[styles.treatmentChipDot, { backgroundColor: color }]} />
      <View style={styles.treatmentChipBody}>
        <Text style={styles.treatmentChipText}>{name}</Text>
        {treatment ? <Text style={styles.treatmentChipEffect}>{treatment.effect}</Text> : null}
      </View>
      {primary ? (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>1순위</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={14} color={C.textLight} />
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function Recommend() {
  const { treatments: TREATMENTS, concerns: CONCERN_DATA, getTreatment } = useData();
  const router = useRouter();
  const uid = useUserId();
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [detailTreatment, setDetailTreatment] = useState<Treatment | null>(null);
  const loadingSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) return;
    setMsgIdx(Math.floor(Math.random() * ANALYSIS_LOADING_MESSAGES.length));
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % ANALYSIS_LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!loading) return;
    loadingSlide.setValue(14);
    Animated.timing(loadingSlide, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [loading, msgIdx, loadingSlide]);

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setPhoto({ uri: res.assets[0].uri, base64: res.assets[0].base64 || '' });
      setResult(null);
      setError(null);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setPhoto({ uri: res.assets[0].uri, base64: res.assets[0].base64 || '' });
      setResult(null);
      setError(null);
    }
  };

  const buildPrompt = () => {
    const concernList = Object.entries(CONCERN_DATA).map(([k, v]) =>
      k + ': 1순위 [' + v.primary.join(', ') + '] / 보조 [' + v.secondary.join(', ') + ']'
    ).join('\n');
    const treatmentList = TREATMENTS.filter(t => t.category !== 'filler').map(t => t.name).join(', ');
    const lines = [
      '당신은 한국 피부과의 피부 분석 도우미예요. 사진을 보고 피부 상태를 분석해주세요.',
      '',
      '추천 가능한 시술 (이 목록 안에서만 골라주세요. 필러 제외):',
      treatmentList,
      '',
      '가능한 피부 고민 카테고리 (사진에서 보이는 모든 항목 체크):',
      '- 피부 표면: 넓은모공, 여드름 흉터, 화농성여드름, 색소침착, 칙칙함, 홍조/붉은기, 건조함',
      '- 주름/탄력: 잔주름, 이마 주름, 미간 주름, 눈가 잔주름, 입가 세로주름, 콧등 주름, 탄력저하, 피부처짐',
      '- 윤곽/볼륨: 이중턱, 사각턱/턱근육, 목 주름/밴드, 눈썹 처짐, 울퉁불퉁한 턱끝, 볼/팔자 꺼짐',
      '- 기타: 수염/얼굴 털',
      '',
      '고민별 시술 매칭:',
      concernList,
      '',
      '판단 기준 (반드시 지켜주세요):',
      '1. 사진에 수염이나 얼굴 털이 보이면 "수염/얼굴 털"을 concerns에 넣고 제모 레이저 추천.',
      '2. 볼이 꺼져 보이거나 팔자 주변이 꺼져 있으면 "볼/팔자 꺼짐"을 concerns에 넣고 쥬베룩 볼륨/스컬트라 추천.',
      '3. 이마/미간/눈가/입가/콧등/턱끝에 주름이 있으면 해당 부위별 보톡스를 추천.',
      '4. 얼굴 윤곽에 사각턱이 있으면 사각턱 보톡스, 인모드 FX 추천.',
      '5. 목 라인이 보이면 목 주름/밴드도 체크.',
      '6. 붉은기나 홍조가 보이면 시너지 MPX 추천.',
      '7. 필러는 절대 추천하지 마세요. 필요해 보이면 needs_consult에 의사 상담 안내만.',
      '8. 미세바늘 고주파(포텐자, 인피니, 시크릿RF, 인트라셀)는 needs_consult에 "포텐자 팁(절연/비절연/약물전달/비침습 RF)은 의사 상담 후 결정" 추가.',
      '9. 보톡스 추천 시 needs_consult에 "약물 종류(보톡스 오리지널, 제오민, 코어톡스, 나보타)는 의사와 상담 후 결정" 추가.',
      '10. 리프팅(울쎄라, 써마지, 슈링크)은 지방량/처짐에 따라 다름. needs_consult에 의사 상담 안내 추가.',
      '11. 시술명은 위 목록의 정확한 이름 사용.',
      '',
      '표현: 추천/진단/처방 대신 "고려 가능한/관리 방향/분석 결과". ~해요/~요 체.',
      '',
      'JSON으로만 응답:',
      '{',
      '  "concerns": ["감지된 모든 피부고민 (1~5개)"],',
      '  "concern_levels": {"고민명": 정도(1~5)} (concerns 각 항목의 심각도. 1=경미, 2=약간 보임, 3=보통, 4=뚜렷함, 5=심함),',
      '  "primary": ["1순위 시술 2~4개"],',
      '  "secondary": ["보조 시술 1~3개"],',
      '  "good_combo": "좋은 조합",',
      '  "caution_combo": "주의 조합",',
      '  "needs_consult": ["의사 상담 항목 1~3개"],',
      '  "summary": "분석 요약 2~3문장"',
      '}'
    ];
    return lines.join('\n');
  };

  // AI 모델 선택
  const analyze = async () => {
    if (!photo) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo.base64 } },
              { type: 'text', text: buildPrompt() },
            ],
          }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map((c: { text?: string }) => c.text || '').join('');
      const cleaned = text.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('parse');
      const parsed = JSON.parse(match[0]);
      const normalized = normalizeAnalysisResult(parsed);
      setResult(normalized);
      if (uid && photo) {
        (async () => {
          try {
            const fileName = `${uid}/${Date.now()}.jpg`;
            const response2 = await fetch(photo.uri);
            const blob = await response2.blob();
            await supabase.storage.from('review-photos').upload(fileName, blob, { contentType: 'image/jpeg' });
            const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(fileName);
            await supabase.from('analysis_records').insert({
              uid,
              photo_url: urlData.publicUrl,
              result: normalized,
            });
          } catch {}
        })();
      }
    } catch {
      setError('분석 중 문제가 생겼어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setError(null);
  };

  if (detailTreatment) {
    return (
      <AppShell currentPage="recommend">
        <TreatmentDetailScreen treatment={detailTreatment} onBack={() => setDetailTreatment(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell currentPage="recommend">
      <SubHeader title="시술 추천받기" onBack={() => router.push('/')} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!result && (
          <>
            <Text style={styles.description}>
              피부 사진을 올려주시면 NO실장이 분석해서 고려할 수 있는 시술을 알려드려요.
            </Text>
            {!photo ? (
              <View>
                <TouchableOpacity onPress={pickFromCamera} style={styles.cameraButton}>
                  <Ionicons name="camera-outline" size={32} color={C.accent} />
                  <Text style={styles.cameraButtonTitle}>카메라로 촬영</Text>
                  <Text style={styles.cameraButtonSub}>지금 바로 얼굴을 촬영해주세요</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickFromGallery} style={styles.galleryButton}>
                  <Ionicons name="image-outline" size={16} color={C.textMuted} />
                  <Text style={styles.galleryButtonText}>갤러리에서 선택</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity onPress={reset} style={styles.photoRemoveBtn}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                {loading && (
                  <View style={styles.loadingBox}>
                    <Ionicons name="sparkles" size={16} color={C.accent} style={{ marginTop: 2 }} />
                    <View style={styles.loadingTickerViewport}>
                      <Animated.Text
                        key={msgIdx}
                        style={[
                          styles.loadingText,
                          {
                            transform: [{ translateY: loadingSlide }],
                            opacity: loadingSlide.interpolate({
                              inputRange: [0, 14],
                              outputRange: [1, 0.25],
                            }),
                          },
                        ]}
                      >
                        {ANALYSIS_LOADING_MESSAGES[msgIdx]}
                      </Animated.Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity
                  onPress={analyze}
                  disabled={loading}
                  style={[styles.analyzeButton, loading && { opacity: 0.6 }]}
                >
                  {loading ? (
                    <>
                      <Spinner size={18} color={C.bg} />
                      <Text style={styles.analyzeButtonText}>분석 중</Text>
                    </>
                  ) : (
                    <Text style={styles.analyzeButtonText}>분석 시작하기</Text>
                  )}
                </TouchableOpacity>
                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
        {result && (
          <View style={styles.resultWrap}>
            <View style={styles.summaryBlock}>
              <Text style={styles.resultLabel}>피부 분석 결과</Text>
              <Text style={styles.resultSummary}>{result.summary}</Text>
            </View>
            <Section title="감지된 피부 고민">
              {result.concern_levels && Object.keys(result.concern_levels).length >= 3 ? (
                <View style={styles.radarWrap}>
                  <ConcernRadar levels={result.concern_levels} />
                </View>
              ) : null}
              <View style={styles.chipRow}>
                {(result.concerns || []).map((c, i) => {
                  const level = result.concern_levels && result.concern_levels[c];
                  return (
                    <View key={i} style={styles.concernChip}>
                      <Text style={styles.concernChipText}>
                        {c}
                        {typeof level === 'number' && (
                          <Text style={styles.concernChipLevel}> {level}/5</Text>
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Section>
            <Section title="1순위 고려 가능한 시술">
              <View style={styles.sectionList}>
                {(result.primary || []).map((p, i) => (
                  <TreatmentChip
                    key={i}
                    name={p}
                    primary
                    onPress={() => {
                      const t = getTreatment(p);
                      if (t) setDetailTreatment(t);
                    }}
                  />
                ))}
              </View>
            </Section>
            {result.secondary && result.secondary.length > 0 && (
              <Section title="보조로 고려 가능한 시술">
                <View style={styles.sectionList}>
                  {result.secondary.map((p, i) => (
                    <TreatmentChip
                      key={i}
                      name={p}
                      onPress={() => {
                        const t = getTreatment(p);
                        if (t) setDetailTreatment(t);
                      }}
                    />
                  ))}
                </View>
              </Section>
            )}
            {result.good_combo ? (
              <Section title="같이 하면 좋은 조합">
                <View style={styles.comboGood}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={C.success} style={{ marginTop: 2 }} />
                  <Text style={styles.comboGoodText}>{result.good_combo}</Text>
                </View>
              </Section>
            ) : null}
            {result.caution_combo ? (
              <Section title="거리두면 좋은 조합">
                <View style={styles.comboCaution}>
                  <Ionicons name="warning-outline" size={16} color={C.danger} style={{ marginTop: 2 }} />
                  <Text style={styles.comboCautionText}>{result.caution_combo}</Text>
                </View>
              </Section>
            ) : null}
            {result.needs_consult && result.needs_consult.length > 0 && (
              <Section title="의사 상담 후 결정해주세요">
                <View style={styles.sectionList}>
                  {result.needs_consult.map((c, i) => (
                    <View key={i} style={styles.consultItem}>
                      <View style={styles.consultIcon}>
                        <Text style={styles.consultIconText}>?</Text>
                      </View>
                      <Text style={styles.consultText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            )}
            <TouchableOpacity onPress={reset} style={styles.resetButton}>
              <Ionicons name="refresh" size={14} color={C.text} />
              <Text style={styles.resetButtonText}>다른 사진으로 다시 분석하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 20, paddingBottom: 28 },
  resultWrap: { paddingBottom: 6 },
  summaryBlock: { marginBottom: 18 },
  radarWrap: { marginBottom: 12 },
  sectionList: { gap: 8 },
  description: { fontSize: 13, color: C.textMuted, lineHeight: 20.8, marginBottom: 16 },
  cameraButton: {
    width: '100%',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.borderStrong,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cameraButtonTitle: { fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  cameraButtonSub: { fontSize: 12, color: C.textMuted },
  galleryButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  galleryButtonText: { fontSize: 13, color: C.textMuted },
  photoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  photoImage: { width: '100%', maxHeight: 320 },
  photoRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    marginTop: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: C.soft,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  loadingTickerViewport: { flex: 1, minHeight: 42, overflow: 'hidden', justifyContent: 'center' },
  loadingText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 21 },
  analyzeButton: {
    width: '100%',
    marginTop: 14,
    padding: 14,
    backgroundColor: C.text,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonText: { fontSize: 15, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
  errorBox: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.dangerBg,
    borderRadius: 12,
  },
  errorText: { fontSize: 13, color: C.danger },
  resultLabel: { fontSize: 11, color: C.accent, fontWeight: '500', marginBottom: 6, fontFamily: F.sansMedium },
  resultSummary: { fontSize: 14, color: C.text, lineHeight: 23.1 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: C.textMuted, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  concernChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: C.accentBg,
    borderRadius: 999,
  },
  concernChipText: { fontSize: 12, fontWeight: '500', color: C.accent, fontFamily: F.sansMedium },
  concernChipLevel: { fontSize: 10, opacity: 0.75, fontWeight: '400' },
  treatmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    gap: 12,
  },
  treatmentChipDot: { width: 8, height: 8, borderRadius: 4 },
  treatmentChipBody: { flex: 1, minWidth: 0 },
  treatmentChipText: { fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  treatmentChipEffect: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  primaryBadge: { paddingVertical: 3, paddingHorizontal: 8, backgroundColor: C.accentBg, borderRadius: 999 },
  primaryBadgeText: { fontSize: 10, fontWeight: '500', color: C.accent, fontFamily: F.sansMedium },
  comboGood: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.successBg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  comboGoodText: { flex: 1, fontSize: 13, color: C.success, lineHeight: 20 },
  comboCaution: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.dangerBg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  comboCautionText: { flex: 1, fontSize: 13, color: C.danger, lineHeight: 20 },
  consultItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.soft,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  consultIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  consultIconText: { fontSize: 11, fontWeight: '600', color: C.accent },
  consultText: { flex: 1, fontSize: 12, color: C.text, lineHeight: 19 },
  resetButton: {
    width: '100%',
    marginTop: 8,
    padding: 13,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resetButtonText: { fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
});

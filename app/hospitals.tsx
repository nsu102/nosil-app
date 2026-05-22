import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Image, Modal, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../data/colors';
import { Hospital } from '../data/hospitals';
import { Review } from '../data/reviews';
import { useData } from '../contexts/DataContext';
import StarRating from '../components/StarRating';
import { useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppShell, { SubHeader } from '../components/AppShell';
import { usePersistedState } from '../hooks/usePersistedState';
import { F } from '../data/fonts';

type ReviewWithPhotos = Review & { photoIds?: string[] };
type ReviewMap = Record<number, ReviewWithPhotos[]>;

function getStats(reviews: ReviewWithPhotos[]) {
  if (!reviews || reviews.length === 0) return { count: 0, avg: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { count: reviews.length, avg };
}

function fmtReviewDate(iso: string) {
  const d = new Date(iso);
  return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
}

function HospitalDetail({ hospital, reviews, onBack, onAddReview, stats }: {
  hospital: Hospital;
  reviews: ReviewWithPhotos[];
  onBack: () => void;
  onAddReview: (rating: number, text: string, photoIds: string[]) => void;
  stats: { count: number; avg: number };
}) {
  const [showWrite, setShowWrite] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoData, setPhotoData] = useState<Record<string, string>>({});
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const pickPhoto = async () => {
    if (newPhotos.length >= 3) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const uri = 'data:image/jpeg;base64,' + result.assets[0].base64;
      setNewPhotos((prev) => [...prev, uri]);
    }
  };

  const submit = async () => {
    if (newRating === 0 || !newText.trim() || saving) return;
    setSaving(true);
    try {
      const photoIds: string[] = [];
      for (const data of newPhotos) {
        const pid = 'p' + Date.now() + Math.random().toString(36).slice(2, 8);
        try {
          await AsyncStorage.setItem('review:photo:' + pid, data);
          photoIds.push(pid);
          setPhotoData((prev) => ({ ...prev, [pid]: data }));
        } catch {}
      }
      onAddReview(newRating, newText.trim(), photoIds);
      setNewRating(0);
      setNewText('');
      setNewPhotos([]);
      setShowWrite(false);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = newRating > 0 && newText.trim() && !saving;

  const loadReviewPhotos = useCallback(async () => {
    const allIds = reviews.flatMap((r) => r.photoIds || []);
    const toLoad = allIds.filter((pid) => !photoData[pid]);
    if (toLoad.length === 0) return;
    const loaded: Record<string, string> = {};
    for (const pid of toLoad) {
      try {
        const val = await AsyncStorage.getItem('review:photo:' + pid);
        if (val) loaded[pid] = val;
      } catch {}
    }
    if (Object.keys(loaded).length > 0) {
      setPhotoData((prev) => ({ ...prev, ...loaded }));
    }
  }, [reviews]);

  useState(() => { loadReviewPhotos(); });

  return (
    <View style={styles.container}>
      <SubHeader title="병원 정보" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.detailPad}>
            <View style={styles.detailAreaBadge}>
              <Text style={styles.detailAreaBadgeText}>{hospital.area}</Text>
            </View>
          <Text style={styles.detailName}>{hospital.name}</Text>

          <View style={styles.infoCard}>
            <View style={styles.ratingRow}>
              <StarRating rating={stats.avg} size={18} />
              {stats.count > 0 ? (
                <>
                  <Text style={styles.avgText}>{stats.avg.toFixed(1)}</Text>
                  <Text style={styles.countText}>리뷰 {stats.count}개</Text>
                </>
              ) : (
                <Text style={[styles.noReview, { fontSize: 12 }]}>아직 리뷰가 없어요</Text>
              )}
            </View>
            <Text style={styles.addrText}>{hospital.address}</Text>
            <TouchableOpacity style={styles.phoneBtn} onPress={() => Linking.openURL(`tel:${hospital.phone}`)}>
              <Ionicons name="call-outline" size={12} color={C.accent} />
              <Text style={styles.phoneBtnText}>{hospital.phone}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>방문 리뷰</Text>
            <TouchableOpacity
              style={[styles.writeBtn, showWrite && styles.writeBtnCancel]}
              onPress={() => setShowWrite(!showWrite)}
            >
              {showWrite ? (
                <Text style={styles.writeBtnTextCancel}>취소</Text>
              ) : (
                <>
                  <Ionicons name="add" size={12} color={C.bg} />
                  <Text style={styles.writeBtnText}>리뷰 작성</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {showWrite && (
            <View style={styles.writeCard}>
              <Text style={styles.writeLabel}>별점</Text>
              <View style={{ marginBottom: 14 }}>
                <StarRating rating={newRating} size={26} onChange={setNewRating} />
              </View>
              <Text style={styles.writeLabel}>한 줄 후기</Text>
              <TextInput
                value={newText}
                onChangeText={setNewText}
                placeholder="시술받으신 경험을 공유해주세요"
                placeholderTextColor={C.textLight}
                multiline
                style={styles.writeInput}
              />
              <Text style={styles.writeLabel}>사진 첨부 <Text style={{ color: C.textLight }}>({newPhotos.length}/3)</Text></Text>
              <View style={styles.photoRow}>
                {newPhotos.map((src, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri: src }} style={styles.photoImg} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => setNewPhotos((p) => p.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close" size={11} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {newPhotos.length < 3 && (
                  <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto}>
                    <Ionicons name="add" size={16} color={C.textMuted} />
                    <Text style={styles.photoAddText}>사진 추가</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={submit}
                disabled={!canSubmit}
              >
                <Text style={styles.submitBtnText}>{saving ? '등록 중...' : '등록하기'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {reviews.length === 0 ? (
            <View style={styles.emptyReview}>
              <Text style={styles.emptyText}>첫 리뷰를 남겨주세요!</Text>
            </View>
          ) : (
            [...reviews].reverse().map((r, i) => {
              const reviewPhotos = (r.photoIds || []).map((pid) => photoData[pid]).filter(Boolean);
              return (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <StarRating rating={r.rating} size={14} />
                    <Text style={styles.reviewDate}>{fmtReviewDate(r.date)}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                  {reviewPhotos.length > 0 && (
                    <View style={styles.reviewPhotos}>
                      {reviewPhotos.map((src, pi) => (
                        <TouchableOpacity key={pi} onPress={() => setViewerSrc(src)}>
                          <Image source={{ uri: src }} style={styles.reviewPhotoImg} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={!!viewerSrc} transparent animationType="fade">
        <TouchableOpacity style={styles.viewer} activeOpacity={1} onPress={() => setViewerSrc(null)}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerSrc(null)}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
          {viewerSrc && <Image source={{ uri: viewerSrc }} style={styles.viewerImg} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function Hospitals() {
  const router = useRouter();
  const { hospitals: HOSPITALS, reviews: supabaseReviews } = useData();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('reviews');
  const [reviews, setReviews] = usePersistedState<ReviewMap>('reviews:all', {} as ReviewMap);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && Object.keys(supabaseReviews).length > 0) {
      setReviews((prev: ReviewMap) => {
        if (Object.keys(prev).length === 0) return supabaseReviews as ReviewMap;
        return prev;
      });
      setInitialized(true);
    }
  }, [supabaseReviews, initialized]);

  const addReview = (id: number, rating: number, text: string, photoIds: string[]) => {
    setReviews((prev: ReviewMap) => ({
      ...prev,
      [id]: [...(prev[id] || []), { rating, text, date: new Date().toISOString(), photoIds }],
    }));
  };

  const getStatsForId = (id: number) => getStats(reviews[id] || []);

  const filtered = HOSPITALS.filter((h) =>
    !query || h.name.includes(query) || h.area.includes(query) || h.address.includes(query)
  );

  const sorted = [...filtered].sort((a, b) => {
    const sa = getStatsForId(a.id), sb = getStatsForId(b.id);
    if (sortBy === 'reviews') return sb.count - sa.count || sb.avg - sa.avg;
    if (sortBy === 'rating') return sb.avg - sa.avg || sb.count - sa.count;
    return a.name.localeCompare(b.name, 'ko');
  });

  const selected = HOSPITALS.find((h) => h.id === selectedId);
  if (selected) {
    return (
      <AppShell currentPage="hospitals">
        <HospitalDetail
          hospital={selected}
          reviews={(reviews[selected.id] || []) as ReviewWithPhotos[]}
          onBack={() => setSelectedId(null)}
          onAddReview={(r, t, p) => addReview(selected.id, r, t, p)}
          stats={getStatsForId(selected.id)}
        />
      </AppShell>
    );
  }

  const SortBtn = ({ value, label }: { value: string; label: string }) => (
    <TouchableOpacity
      style={[styles.sortBtn, sortBy === value && styles.sortBtnActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortBtnText, sortBy === value && styles.sortBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <AppShell currentPage="hospitals">
      <SubHeader title="NO실장 병원" onBack={() => router.push('/')} />
      <View style={styles.topPad}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={C.textLight} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="병원명, 지역으로 검색해주세요"
            placeholderTextColor={C.textLight}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.sortRow}>
          <SortBtn value="reviews" label="리뷰 많은 순" />
          <SortBtn value="rating" label="별점 순" />
          <SortBtn value="name" label="이름 순" />
        </View>
        <Text style={styles.totalText}>총 {sorted.length}곳</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const s = getStatsForId(item.id);
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedId(item.id)}>
              <View style={styles.cardHeader}>
                <View style={styles.areaBadge}>
                  <Text style={styles.areaBadgeText}>{item.area}</Text>
                </View>
                <Text style={styles.cardName}>{item.name}</Text>
              </View>
              <Text style={styles.cardAddr}>{item.address}</Text>
              <View style={styles.cardFooter}>
                {s.count > 0 ? (
                  <>
                    <StarRating rating={s.avg} size={12} />
                    <Text style={styles.cardAvg}>{s.avg.toFixed(1)}</Text>
                    <Text style={styles.cardCount}>· 리뷰 {s.count}개</Text>
                  </>
                ) : (
                  <Text style={styles.noReview}>아직 리뷰가 없어요</Text>
                )}
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={14} color={C.textLight} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topPad: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12 },
  searchWrap: { marginBottom: 12, position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, top: 12, zIndex: 1 },
  searchInput: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingLeft: 38, paddingRight: 14, fontSize: 13, color: C.text },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border },
  sortBtnActive: { backgroundColor: C.text, borderColor: C.text },
  sortBtnText: { fontSize: 12, fontWeight: '500', color: C.textMuted, fontFamily: F.sansMedium },
  sortBtnTextActive: { color: C.bg },
  totalText: { fontSize: 11, color: C.textMuted, marginTop: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 0 },
  card: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  areaBadge: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.soft, borderRadius: 999 },
  areaBadgeText: { fontSize: 10, color: C.accent, fontWeight: '500', fontFamily: F.sansMedium },
  detailAreaBadge: { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: C.soft, borderRadius: 999, alignSelf: 'flex-start' },
  detailAreaBadgeText: { fontSize: 11, color: C.accent, fontWeight: '500', fontFamily: F.sansMedium },
  cardName: { fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  cardAddr: { fontSize: 12, color: C.textMuted, lineHeight: 18.6, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardAvg: { fontSize: 11, color: C.text, fontWeight: '500', fontFamily: F.sansMedium },
  cardCount: { fontSize: 11, color: C.textMuted },
  noReview: { fontSize: 11, color: C.textLight },
  detailPad: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 24 },
  detailName: { fontSize: 22, fontWeight: '500', color: C.text, marginTop: 8, marginBottom: 14, fontFamily: F.sansMedium },
  infoCard: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avgText: { fontSize: 16, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  countText: { fontSize: 12, color: C.textMuted },
  addrText: { fontSize: 12, color: C.textMuted, lineHeight: 19.2, marginBottom: 4 },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  phoneBtnText: { fontSize: 12, color: C.accent, fontWeight: '500', fontFamily: F.sansMedium },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reviewTitle: { fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.text, borderRadius: 999 },
  writeBtnCancel: { backgroundColor: C.soft },
  writeBtnText: { fontSize: 12, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
  writeBtnTextCancel: { fontSize: 12, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  writeCard: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.borderStrong, borderRadius: 14, padding: 16, marginBottom: 14 },
  writeLabel: { fontSize: 12, color: C.textMuted, marginBottom: 8 },
  writeInput: { backgroundColor: C.bg, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13, color: C.text, minHeight: 80, textAlignVertical: 'top', lineHeight: 19.5, marginBottom: 12 },
  photoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', borderWidth: 0.5, borderColor: C.border },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoAdd: { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: C.borderStrong, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 2 },
  photoAddText: { fontSize: 10, color: C.textMuted },
  submitBtn: { backgroundColor: C.text, borderRadius: 12, padding: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: C.borderStrong },
  submitBtnText: { fontSize: 13, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
  emptyReview: { alignItems: 'center', padding: 32, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12 },
  emptyText: { fontSize: 13, color: C.textLight },
  reviewCard: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reviewDate: { fontSize: 11, color: C.textLight },
  reviewText: { fontSize: 13, color: C.text, lineHeight: 20.8 },
  reviewPhotos: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  reviewPhotoImg: { width: 76, height: 76, borderRadius: 8, borderWidth: 0.5, borderColor: C.border },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  viewerClose: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  viewerImg: { width: '100%', height: '80%', borderRadius: 8 },
});

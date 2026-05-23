import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, TREATMENT_COLORS } from '../data/colors';
import { Treatment } from '../data/treatments';
import { useData } from '../contexts/DataContext';
import TreatmentDetail from '../components/TreatmentDetail';
import { useState } from 'react';
import AppShell, { SubHeader } from '../components/AppShell';
import { F } from '../data/fonts';

export default function Encyclopedia() {
  const router = useRouter();
  const { categories: CATEGORIES, treatments: TREATMENTS, loading } = useData();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Treatment | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCat = (key: string) => setExpandedCats((prev) => ({ ...prev, [key]: !prev[key] }));

  const filtered = TREATMENTS.filter(
    (t) =>
      !query ||
      t.name.includes(query) ||
      t.effect.includes(query) ||
      (t.spec && t.spec.includes(query)) ||
      t.concerns.some((c) => c.includes(query))
  );
  const isSearching = query.length > 0;

  const grouped: Record<string, Treatment[]> = {};
  CATEGORIES.forEach((c) => { grouped[c.key] = []; });
  filtered.forEach((t) => { if (grouped[t.category]) grouped[t.category].push(t); });

  if (selected) {
    return (
      <AppShell currentPage="encyclopedia">
        <TreatmentDetail treatment={selected} onBack={() => setSelected(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell currentPage="encyclopedia">
      <SubHeader title="시술 백과사전" onBack={() => router.push('/')} />
      <View style={s.searchWrap}>
        <View style={s.searchRow}>
        <Ionicons name="search" size={16} color={C.textLight} style={s.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="시술명, 효과, 고민으로 검색해주세요"
          placeholderTextColor={C.textLight}
          style={s.searchInput}
        />
        </View>
      </View>
      <ScrollView contentContainerStyle={s.listContent}>
        {isSearching ? (
          <>
            {filtered.map((t) => (
              <TouchableOpacity key={t.name} style={s.searchItem} onPress={() => setSelected(t)}>
                <View style={[s.dot, { backgroundColor: TREATMENT_COLORS[t.name] || C.accent }]} />
                <View style={s.searchItemText}>
                  <Text style={s.searchItemName}>{t.name}</Text>
                  <Text style={s.searchItemEffect} numberOfLines={1}>{t.effect}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <Text style={s.emptyText}>검색 결과가 없어요</Text>
            )}
          </>
        ) : (
          CATEGORIES.map((cat) => {
            const items = grouped[cat.key] || [];
            if (items.length === 0) return null;
            const expanded = expandedCats[cat.key];
            return (
              <View key={cat.key} style={s.catCard}>
                <TouchableOpacity style={s.catHeader} onPress={() => toggleCat(cat.key)}>
                  <View>
                    <Text style={s.catName}>{cat.name}</Text>
                    <Text style={s.catCount}>{items.length}개 시술</Text>
                  </View>
                  <Ionicons
                    name={expanded ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={C.textLight}
                  />
                </TouchableOpacity>
                {expanded && (
                  <View style={s.catBody}>
                    {items.map((t, idx) => (
                      <TouchableOpacity
                        key={t.name}
                        style={[s.catItem, idx > 0 && s.catItemBorder]}
                        onPress={() => setSelected(t)}
                      >
                        <View style={[s.dotSmall, { backgroundColor: TREATMENT_COLORS[t.name] || C.accent }]} />
                        <View style={s.catItemText}>
                          <Text style={s.catItemName}>{t.name}</Text>
                          {t.spec ? <Text style={s.catItemSpec}>{t.spec}</Text> : null}
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={C.textLight} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </AppShell>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchWrap: { paddingTop: 16, paddingBottom: 12, paddingHorizontal: 20 },
  searchRow: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 38,
    paddingRight: 14,
    fontSize: 13,
    color: C.text,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  searchItem: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  searchItemText: { flex: 1 },
  searchItemName: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 2, fontFamily: F.sansMedium },
  searchItemEffect: { fontSize: 11, color: C.textMuted },
  emptyText: { textAlign: 'center', padding: 40, color: C.textMuted, fontSize: 13 },
  catCard: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  catHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catName: { fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  catCount: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  catBody: { borderTopWidth: 0.5, borderTopColor: C.border, backgroundColor: C.bg },
  catItem: {
    paddingVertical: 12,
    paddingRight: 16,
    paddingLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catItemBorder: { borderTopWidth: 0.5, borderTopColor: C.border },
  dotSmall: { width: 6, height: 6, borderRadius: 3 },
  catItemText: { flex: 1 },
  catItemName: { fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  catItemSpec: { fontSize: 10, color: C.textLight, marginTop: 1 },
});

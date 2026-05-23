import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePersistedState } from '../hooks/usePersistedState';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '../contexts/DataContext';
import { C, TREATMENT_COLORS } from '../data/colors';
import { generateSchedule, analyzeCombo } from '../utils/schedule';
import { fmtDate, fmtFull, addDays, isSameDay } from '../utils/date';
import AppShell, { SubHeader } from '../components/AppShell';
import { F } from '../data/fonts';
import NativeDateField from '../components/NativeDateField';
import { useUserId } from '../hooks/useUserId';
import { syncTreatmentRecord, loadTreatmentRecord } from '../utils/sync';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 24) / 7);

type ScheduleEvent = { name: string; date: Date; isPast?: boolean };

const PastTreatmentModal = ({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, dates: string[]) => void;
}) => {
  const { categories: CATEGORIES, treatments: TREATMENTS } = useData();
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [singleDate, setSingleDate] = useState(today);
  const [dates, setDates] = useState([today]);

  const filtered = TREATMENTS.filter(t => t.category !== 'filler').filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    const cat = CATEGORIES.find(c => c.key === t.category);
    return t.name.toLowerCase().includes(q) ||
      (t.spec && t.spec.toLowerCase().includes(q)) ||
      (cat && cat.name.toLowerCase().includes(q));
  });

  const updateDate = (idx: number, val: string) => setDates(prev => prev.map((d, i) => i === idx ? val : d));
  const addDateRow = () => setDates(prev => [...prev, today]);
  const removeDateRow = (idx: number) => setDates(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = () => {
    if (!selectedTreatment) return;
    const finalDates = mode === 'single' ? [singleDate] : dates.filter(d => d);
    if (finalDates.length === 0) return;
    finalDates.sort((a, b) => a.localeCompare(b));
    onAdd(selectedTreatment, finalDates);
    onClose();
  };

  const canSubmit = selectedTreatment && (mode === 'single' ? singleDate : dates.filter(d => d).length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ms.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={ms.sheet}>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>과거 시술 기록 추가</Text>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
              <Ionicons name="close" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={ms.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={ms.label}>입력 방식</Text>
            <View style={ms.modeRow}>
              <TouchableOpacity
                style={[ms.modeBtn, mode === 'single' && ms.modeBtnActive]}
                onPress={() => setMode('single')}
              >
                <Text style={[ms.modeBtnText, mode === 'single' && ms.modeBtnTextActive]}>간단 입력</Text>
                <Text style={[ms.modeBtnSub, mode === 'single' && ms.modeBtnSubActive]}>시술명 + 날짜 1개</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.modeBtn, mode === 'multi' && ms.modeBtnActive]}
                onPress={() => setMode('multi')}
              >
                <Text style={[ms.modeBtnText, mode === 'multi' && ms.modeBtnTextActive]}>회차별 입력</Text>
                <Text style={[ms.modeBtnSub, mode === 'multi' && ms.modeBtnSubActive]}>같은 시술 여러 날짜</Text>
              </TouchableOpacity>
            </View>

            <Text style={ms.label}>시술 선택</Text>
            <View style={ms.searchWrap}>
              <Ionicons name="search" size={13} color={C.textLight} style={ms.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="시술명 검색"
                placeholderTextColor={C.textLight}
                style={ms.searchInput}
              />
            </View>
            <ScrollView style={ms.treatmentList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {filtered.length === 0 ? (
                <Text style={ms.emptyText}>검색 결과가 없어요</Text>
              ) : filtered.map(t => {
                const isSelected = selectedTreatment === t.name;
                return (
                  <TouchableOpacity
                    key={t.name}
                    onPress={() => setSelectedTreatment(t.name)}
                    style={[ms.treatmentItem, isSelected && { backgroundColor: C.accentBg }]}
                  >
                    <View style={[ms.dot7, { backgroundColor: TREATMENT_COLORS[t.name] || C.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[ms.treatmentName, isSelected && { fontWeight: '500' }]}>{t.name}</Text>
                      {t.spec ? <Text style={ms.treatmentSpec}>{t.spec}</Text> : null}
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={14} color={C.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {mode === 'single' ? (
              <>
                <Text style={ms.label}>시술 받은 날짜</Text>
                <View style={ms.dateInputWrap}>
                  <NativeDateField
                    value={singleDate}
                    onChange={setSingleDate}
                    max={today}
                    textStyle={ms.dateInput}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={ms.label}>회차별 시술 날짜</Text>
                {dates.map((d, i) => (
                  <View key={i} style={ms.multiDateRow}>
                    <Text style={ms.multiDateLabel}>{i + 1}회</Text>
                    <View style={ms.multiDateInputWrap}>
                      <NativeDateField
                        value={d}
                        onChange={(val) => updateDate(i, val)}
                        max={today}
                        textStyle={ms.dateInput}
                      />
                    </View>
                    {dates.length > 1 && (
                      <TouchableOpacity onPress={() => removeDateRow(i)} style={ms.removeDateBtn}>
                        <Ionicons name="close" size={14} color={C.textLight} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity onPress={addDateRow} style={ms.addDateBtn}>
                  <Ionicons name="add" size={12} color={C.textMuted} />
                  <Text style={ms.addDateText}>회차 추가</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={ms.sheetFooter}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[ms.submitBtn, !canSubmit && { backgroundColor: C.borderStrong }]}
            >
              <Text style={ms.submitText}>
                {!selectedTreatment ? '시술을 선택해주세요' :
                  mode === 'single' ? '기록 등록' :
                  dates.filter(d => d).length + '회 기록 등록'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function MyRecord() {
  const { categories: CATEGORIES, treatments: TREATMENTS, getTreatment } = useData();
  const router = useRouter();
  const uid = useUserId();
  const [step, setStep] = usePersistedState<string>('manager:step', 'select');
  const [counts, setCounts] = usePersistedState<Record<string, number>>('manager:counts', {});
  const [startDate, setStartDate] = usePersistedState<string>('manager:startDate', new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = usePersistedState<ScheduleEvent[]>('manager:schedule', [], {
    serialize: (s) => JSON.stringify(s.map(e => ({ name: e.name, date: e.date instanceof Date ? e.date.toISOString() : e.date }))),
    deserialize: (s) => JSON.parse(s).map((e: any) => ({ name: e.name, date: new Date(e.date) }))
  });
  const [pastTreatments, setPastTreatments] = usePersistedState<ScheduleEvent[]>('manager:pastTreatments', [], {
    serialize: (s) => JSON.stringify(s.map(e => ({ name: e.name, date: e.date instanceof Date ? e.date.toISOString() : e.date }))),
    deserialize: (s) => JSON.parse(s).map((e: any) => ({ name: e.name, date: new Date(e.date) }))
  });
  const [showPastModal, setShowPastModal] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const data = await loadTreatmentRecord(uid);
      if (!mounted || !data) return;
      setStep(data.step);
      setCounts(data.counts);
      if (data.startDate) setStartDate(data.startDate);
      if (data.schedule.length > 0) setSchedule(data.schedule);
      if (data.pastTreatments.length > 0) setPastTreatments(data.pastTreatments);
    })();
    return () => { mounted = false; };
  }, [uid]);

  const saveToSupabase = useCallback(() => {
    if (!uid) return;
    syncTreatmentRecord(uid, { step, counts, startDate, schedule, pastTreatments });
  }, [uid, step, counts, startDate, schedule, pastTreatments]);

  useEffect(() => {
    if (!uid) return;
    saveToSupabase();
  }, [saveToSupabase]);

  const totalSessions = Object.values(counts).reduce((a, b) => a + b, 0);
  const selectedNames = Object.keys(counts);
  const combo = useMemo(() => analyzeCombo(selectedNames), [selectedNames.join('|')]);

  const adjust = (name: string, delta: number) => {
    setCounts(prev => {
      const v = (prev[name] || 0) + delta;
      const next = { ...prev };
      if (v <= 0) delete next[name]; else next[name] = v;
      return next;
    });
  };

  const doGenerate = () => {
    const selected = Object.entries(counts).map(([name, count]) => ({ name, count }));
    if (selected.length === 0) return;
    const events = generateSchedule(selected, new Date(startDate));
    setSchedule(events);
    if (events.length > 0) setViewMonth(new Date(events[0].date.getFullYear(), events[0].date.getMonth(), 1));
    setStep('calendar');
    setShowWarning(false);
  };

  const handleGenerateClick = () => {
    if (combo.avoids.length > 0) setShowWarning(true);
    else doGenerate();
  };

  const reset = () => { setCounts({}); setSchedule([]); setSelectedDate(null); setStep('select'); };

  if (step === 'select') {
    return (
      <AppShell currentPage="record">
        <SubHeader title="스킨 매니저" onBack={() => router.push('/')} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={s.desc}>받기로 한 시술과 횟수를 선택해주세요. 권장 간격에 맞춰 자동으로 스케줄을 짜드릴게요.</Text>
            <TouchableOpacity onPress={() => setStep('calendar')}>
              <Text style={s.linkText}>과거 시술 기록만 추가하고 싶어요 →</Text>
            </TouchableOpacity>
            <View style={s.dateCard}>
              <Text style={s.dateLabel}>시작일</Text>
              <NativeDateField
                value={startDate}
                onChange={setStartDate}
                max={new Date().toISOString().split('T')[0]}
                textStyle={s.dateInput}
              />
            </View>
          </View>

          {selectedNames.length >= 2 && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              {combo.goods.length > 0 && (
                <View style={s.comboGood}>
                  <View style={s.comboHeader}>
                    <Ionicons name="checkmark-circle" size={14} color={C.success} />
                    <Text style={s.comboGoodTitle}>같은 날 진행해도 좋은 조합이에요</Text>
                  </View>
                  {combo.goods.map((pair, i) => (
                    <Text key={i} style={s.comboGoodItem}>· {pair[0]} + {pair[1]}</Text>
                  ))}
                </View>
              )}
              {combo.avoids.length > 0 && (
                <View style={s.comboBad}>
                  <View style={s.comboHeader}>
                    <Ionicons name="warning" size={14} color={C.danger} />
                    <Text style={s.comboBadTitle}>거리를 두면 좋은 조합이에요</Text>
                  </View>
                  {combo.avoids.map((pair, i) => {
                    const tA = getTreatment(pair[0]);
                    const tB = getTreatment(pair[1]);
                    const gap = Math.max((tA && tA.distance) || 2, (tB && tB.distance) || 2);
                    return (
                      <Text key={i} style={s.comboBadItem}>· {pair[0]} 후 {pair[1]}은 {gap}주 뒤로 잡아드릴게요</Text>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <View style={s.searchWrap}>
              <Ionicons name="search" size={14} color={C.textLight} style={{ position: 'absolute', left: 12, zIndex: 1 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="시술명, 카테고리로 검색해주세요"
                placeholderTextColor={C.textLight}
                style={s.searchInput}
              />
            </View>
            {totalSessions > 0 && (
              <View style={s.selectedInfo}>
                <Text style={s.selectedCount}>{selectedNames.length}개 시술 · 총 {totalSessions}회 선택</Text>
                <TouchableOpacity onPress={() => setCounts({})} style={s.resetSmall}>
                  <Ionicons name="refresh" size={11} color={C.textMuted} />
                  <Text style={s.resetSmallText}> 선택 초기화</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {TREATMENTS.filter(t => t.category !== 'filler').filter(t => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              const cat = CATEGORIES.find(c => c.key === t.category);
              return t.name.toLowerCase().includes(q) ||
                (t.spec && t.spec.toLowerCase().includes(q)) ||
                (cat && cat.name.toLowerCase().includes(q)) ||
                t.effect.toLowerCase().includes(q);
            }).map(t => {
              const count = counts[t.name] || 0;
              return (
                <View key={t.name} style={[s.treatmentRow, count > 0 && { backgroundColor: C.accentBg, borderColor: C.borderStrong }]}>
                  <View style={[s.dot8, { backgroundColor: TREATMENT_COLORS[t.name] || C.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.treatmentName}>{t.name}</Text>
                    <Text style={s.treatmentInterval}>{t.interval}주 간격</Text>
                  </View>
                  <View style={s.counterRow}>
                    <TouchableOpacity onPress={() => adjust(t.name, -1)} disabled={count === 0} style={[s.counterBtn, count === 0 && { opacity: 0.4 }]}>
                      <Ionicons name="remove" size={12} color={C.text} />
                    </TouchableOpacity>
                    <Text style={s.counterText}>{count}</Text>
                    <TouchableOpacity onPress={() => adjust(t.name, 1)} style={s.counterBtn}>
                      <Ionicons name="add" size={12} color={C.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <LinearGradient colors={['rgba(250,247,242,0)', C.bg]} locations={[0, 0.3]} style={s.bottomBar}>
          <TouchableOpacity
            onPress={handleGenerateClick}
            disabled={totalSessions === 0}
            style={[s.generateBtn, totalSessions === 0 && { backgroundColor: C.borderStrong }]}
          >
            <Text style={s.generateText}>
              {totalSessions === 0 ? '시술을 선택해주세요' : '총 ' + totalSessions + '회 스케줄 만들기'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <Modal visible={showWarning} transparent animationType="fade" onRequestClose={() => setShowWarning(false)}>
          <TouchableOpacity style={s.warningOverlay} activeOpacity={1} onPress={() => setShowWarning(false)}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={s.warningCard}>
              <View style={s.warningHeader}>
                <View style={s.warningIcon}>
                  <Ionicons name="warning" size={16} color={C.danger} />
                </View>
                <Text style={s.warningTitle}>잠깐 확인해주세요</Text>
              </View>
              <Text style={s.warningDesc}>동일일자 진행은 주의가 필요한 조합이 포함되어 있어요.</Text>
              <View style={s.warningList}>
                {combo.avoids.map((pair, i) => (
                  <Text key={i} style={s.warningItem}>· {pair[0]} ↔ {pair[1]}</Text>
                ))}
              </View>
              <Text style={s.warningSub}>권장 간격에 맞춰 거리두고 자동 배치해드려요. 그대로 진행하실까요?</Text>
              <View style={s.warningBtns}>
                <TouchableOpacity onPress={() => setShowWarning(false)} style={s.warningCancelBtn}>
                  <Text style={s.warningCancelText}>다시 고를게요</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={doGenerate} style={s.warningConfirmBtn}>
                  <Text style={s.warningConfirmText}>그대로 진행</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </AppShell>
    );
  }

  const today = new Date();
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const futureWithFlag = schedule.map(e => ({ ...e, isPast: false }));
  const pastWithFlag = pastTreatments.map(e => ({ ...e, isPast: true }));
  const allEvents = [...pastWithFlag, ...futureWithFlag];
  const monthEvents = allEvents.filter(e => e.date.getFullYear() === year && e.date.getMonth() === month);
  const eventsForDate = (day: number) => monthEvents.filter(e => e.date.getDate() === day);
  const selectedEvents = selectedDate ? allEvents.filter(e => isSameDay(e.date, selectedDate)) : [];
  const sortedAllEvents = [...allEvents].sort((a, b) => a.date.getTime() - b.date.getTime());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const removePast = (idx: number) => setPastTreatments(prev => prev.filter((_, i) => i !== idx));

  return (
    <AppShell currentPage="record">
      <SubHeader title="내 스킨 스케줄" onBack={() => setStep('select')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={s.calNav}>
          <TouchableOpacity onPress={() => setViewMonth(new Date(year, month - 1, 1))} style={s.calNavBtn}>
            <Ionicons name="chevron-back" size={18} color={C.text} />
          </TouchableOpacity>
          <Text style={s.calNavTitle}>{year}년 {month + 1}월</Text>
          <TouchableOpacity onPress={() => setViewMonth(new Date(year, month + 1, 1))} style={s.calNavBtn}>
            <Ionicons name="chevron-forward" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={s.calWeekRow}>
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <Text key={d} style={[s.calWeekDay, i === 0 && { color: '#D45B7B' }, i === 6 && { color: '#7BAEDF' }]}>{d}</Text>
          ))}
        </View>

        <View style={s.calGrid}>
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={s.calCell} />;
            const date = new Date(year, month, d);
            const events = eventsForDate(d);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => events.length > 0 && setSelectedDate(date)}
                activeOpacity={events.length > 0 ? 0.6 : 1}
                style={[
                  s.calCell,
                  isSelected && { backgroundColor: C.text },
                  isToday && !isSelected && { backgroundColor: C.accentBg },
                ]}
              >
                <Text style={[s.calDay, isSelected && { color: C.bg }, (isToday && !isSelected) && { fontWeight: '500' }]}>{d}</Text>
                {events.length > 0 && (
                  <View style={s.calDots}>
                    {events.slice(0, 3).map((e, ei) => {
                      const color = TREATMENT_COLORS[e.name] || C.accent;
                      return e.isPast ? (
                        <View key={ei} style={[s.calDotOutline, { borderColor: color }]} />
                      ) : (
                        <View key={ei} style={[s.calDotFill, { backgroundColor: color }]} />
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: C.accent }]} />
            <Text style={s.legendText}>예정</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDotOutline, { borderColor: C.accent }]} />
            <Text style={s.legendText}>과거 기록</Text>
          </View>
        </View>

        {selectedDate && selectedEvents.length > 0 && (
          <View style={s.selectedCard}>
            <Text style={s.selectedCardDate}>{fmtFull(selectedDate)}</Text>
            {selectedEvents.map((e, i) => {
              const color = TREATMENT_COLORS[e.name] || C.accent;
              return (
                <View key={i} style={s.selectedEventRow}>
                  {e.isPast ? (
                    <View style={[s.dot10outline, { borderColor: color }]} />
                  ) : (
                    <View style={[s.dot10fill, { backgroundColor: color }]} />
                  )}
                  <Text style={s.selectedEventName}>{e.name}</Text>
                  {e.isPast && <Text style={s.doneTag}>완료</Text>}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity onPress={() => setShowPastModal(true)} style={s.addPastBtn}>
          <Ionicons name="add" size={14} color={C.text} />
          <Text style={s.addPastText}>과거 시술 기록 추가</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 20 }}>
          <Text style={s.allEventsTitle}>전체 일정 ({allEvents.length}회 · 과거 {pastTreatments.length}회 · 예정 {schedule.length}회)</Text>
          {sortedAllEvents.map((e, i) => {
            const color = TREATMENT_COLORS[e.name] || C.accent;
            const pastIdx = e.isPast ? pastTreatments.findIndex(p => p.name === e.name && isSameDay(p.date, e.date)) : -1;
            return (
              <View key={i} style={[s.eventRow, e.isPast && { opacity: 0.7 }]}>
                {e.isPast ? (
                  <View style={[s.dot8outline, { borderColor: color }]} />
                ) : (
                  <View style={[s.dot8, { backgroundColor: color }]} />
                )}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.eventName}>{e.name}</Text>
                  {e.isPast && (
                    <View style={s.pastBadge}>
                      <Text style={s.pastBadgeText}>과거</Text>
                    </View>
                  )}
                </View>
                <Text style={s.eventDate}>{fmtDate(e.date)}</Text>
                {e.isPast && pastIdx !== -1 && (
                  <TouchableOpacity onPress={() => removePast(pastIdx)} style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="close" size={13} color={C.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity onPress={reset} style={s.resetBtn}>
          <Ionicons name="refresh" size={13} color={C.text} />
          <Text style={s.resetBtnText}>예정 일정 다시 짜기</Text>
        </TouchableOpacity>
      </ScrollView>

      <PastTreatmentModal
        visible={showPastModal}
        onClose={() => setShowPastModal(false)}
        onAdd={(name, dates) => {
          const newEntries = dates.map(d => ({ name, date: new Date(d) }));
          setPastTreatments(prev => [...prev, ...newEntries]);
          if (newEntries.length > 0) {
            const firstDate = newEntries[0].date;
            setViewMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
          }
        }}
      />
    </AppShell>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  desc: { fontSize: 13, color: C.textMuted, lineHeight: 20.8, letterSpacing: 0.55, marginBottom: 12 },
  linkText: { fontSize: 12, color: C.accent, textDecorationLine: 'underline', marginBottom: 14 },
  dateCard: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 },
  dateLabel: { fontSize: 11, color: C.textMuted, marginBottom: 6 },
  dateInput: { fontSize: 14, color: C.text, padding: 0 },
  comboGood: { padding: 14, backgroundColor: C.successBg, borderRadius: 12, marginBottom: 8 },
  comboHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  comboGoodTitle: { fontSize: 12, fontWeight: '500', color: C.success, fontFamily: F.sansMedium },
  comboGoodItem: { fontSize: 12, color: C.success, lineHeight: 18, marginLeft: 22 },
  comboBad: { padding: 14, backgroundColor: C.dangerBg, borderRadius: 12, marginBottom: 8 },
  comboBadTitle: { fontSize: 12, fontWeight: '500', color: C.danger, fontFamily: F.sansMedium },
  comboBadItem: { fontSize: 12, color: C.danger, lineHeight: 18.6, marginLeft: 22 },
  searchWrap: { position: 'relative', justifyContent: 'center' },
  searchInput: { width: '100%', paddingVertical: 10, paddingLeft: 34, paddingRight: 12, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, fontSize: 12, color: C.text },
  selectedInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  selectedCount: { fontSize: 11, color: C.textMuted, fontFamily: F.sansMedium },
  resetSmall: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderWidth: 0.5, borderColor: C.borderStrong, borderRadius: 999 },
  resetSmallText: { fontSize: 11, color: C.textMuted, fontFamily: F.sansMedium },
  treatmentRow: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot8: { width: 8, height: 8, borderRadius: 4 },
  dot8outline: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, backgroundColor: 'transparent' },
  treatmentName: { fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  treatmentInterval: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 0.5, borderColor: C.borderStrong, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontSize: 14, fontWeight: '500', color: C.text, minWidth: 18, textAlign: 'center', fontFamily: F.sansMedium },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 14 },
  generateBtn: { width: '100%', padding: 14, backgroundColor: C.text, borderRadius: 14, alignItems: 'center' },
  generateText: { fontSize: 15, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
  warningOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  warningCard: { backgroundColor: C.bg, borderRadius: 18, maxWidth: 340, width: '100%', paddingVertical: 24, paddingHorizontal: 22 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  warningIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center' },
  warningTitle: { fontSize: 16, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  warningDesc: { fontSize: 13, color: C.text, lineHeight: 21, marginBottom: 8 },
  warningList: { backgroundColor: C.dangerBg, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
  warningItem: { fontSize: 12, color: C.danger, lineHeight: 20 },
  warningSub: { fontSize: 12, color: C.textMuted, lineHeight: 19, marginBottom: 18 },
  warningBtns: { flexDirection: 'row', gap: 8 },
  warningCancelBtn: { flex: 1, padding: 12, borderWidth: 0.5, borderColor: C.borderStrong, borderRadius: 12, alignItems: 'center' },
  warningCancelText: { fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  warningConfirmBtn: { flex: 1, padding: 12, backgroundColor: C.text, borderRadius: 12, alignItems: 'center' },
  warningConfirmText: { fontSize: 13, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calNavBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  calNavTitle: { fontSize: 16, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  calWeekRow: { flexDirection: 'row', marginBottom: 6 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 11, color: C.textMuted, paddingVertical: 4 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calCell: { width: (SCREEN_WIDTH - 40 - 24) / 7, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  calDay: { fontSize: 12, color: C.text },
  calDots: { flexDirection: 'row', gap: 2, justifyContent: 'center', flexWrap: 'wrap' },
  calDotFill: { width: 5, height: 5, borderRadius: 2.5 },
  calDotOutline: { width: 5, height: 5, borderRadius: 2.5, borderWidth: 1, backgroundColor: 'transparent' },
  legend: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendDotOutline: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, backgroundColor: 'transparent' },
  legendText: { fontSize: 10, color: C.textMuted, fontFamily: F.sansMedium },
  selectedCard: { marginTop: 18, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  selectedCardDate: { fontSize: 12, color: C.accent, fontWeight: '500', marginBottom: 8 },
  selectedEventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot10fill: { width: 10, height: 10, borderRadius: 5 },
  dot10outline: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, backgroundColor: 'transparent' },
  selectedEventName: { fontSize: 14, color: C.text, fontWeight: '500', fontFamily: F.sansMedium },
  doneTag: { fontSize: 10, color: C.textLight, marginLeft: 'auto' },
  addPastBtn: { width: '100%', marginTop: 18, padding: 12, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.borderStrong, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addPastText: { fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  allEventsTitle: { fontSize: 13, fontWeight: '500', color: C.textMuted, marginBottom: 10, fontFamily: F.sansMedium },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, marginBottom: 6 },
  eventName: { fontSize: 13, color: C.text, fontWeight: '500', fontFamily: F.sansMedium },
  pastBadge: { paddingHorizontal: 6, paddingVertical: 1, backgroundColor: C.soft, borderRadius: 999 },
  pastBadgeText: { fontSize: 9, color: C.textMuted, fontFamily: F.sansMedium },
  eventDate: { fontSize: 12, color: C.textMuted },
  resetBtn: { width: '100%', marginTop: 18, padding: 12, borderWidth: 0.5, borderColor: C.borderStrong, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  resetBtnText: { fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: 22 },
  label: { fontSize: 11, color: C.textMuted, marginBottom: 8 },
  modeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  modeBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 10 },
  modeBtnActive: { backgroundColor: C.text, borderColor: C.text },
  modeBtnText: { fontSize: 12, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  modeBtnTextActive: { color: C.bg },
  modeBtnSub: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  modeBtnSubActive: { color: C.bg, opacity: 0.7 },
  searchWrap: { position: 'relative', justifyContent: 'center', marginBottom: 8 },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  searchInput: { width: '100%', paddingVertical: 9, paddingLeft: 32, paddingRight: 12, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, fontSize: 12, color: C.text },
  treatmentList: { maxHeight: 180, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 },
  emptyText: { padding: 16, textAlign: 'center', fontSize: 12, color: C.textLight },
  treatmentItem: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot7: { width: 7, height: 7, borderRadius: 3.5 },
  treatmentName: { fontSize: 12.5, color: C.text, fontFamily: F.sansMedium },
  treatmentSpec: { fontSize: 10, color: C.textLight },
  dateInputWrap: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 16 },
  dateInput: { fontSize: 13, color: C.text, padding: 0 },
  multiDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  multiDateLabel: { fontSize: 11, color: C.textMuted, minWidth: 32 },
  multiDateInputWrap: { flex: 1, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  removeDateBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  addDateBtn: { width: '100%', padding: 10, borderWidth: 1, borderColor: C.borderStrong, borderStyle: 'dashed', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 16 },
  addDateText: { fontSize: 12, color: C.textMuted, fontFamily: F.sansMedium },
  sheetFooter: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18, borderTopWidth: 0.5, borderTopColor: C.border },
  submitBtn: { width: '100%', padding: 13, backgroundColor: C.text, borderRadius: 12, alignItems: 'center' },
  submitText: { fontSize: 14, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
});

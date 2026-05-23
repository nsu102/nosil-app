import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LinearGradient } from 'expo-linear-gradient';
import { C, TREATMENT_COLORS } from '../data/colors';
import { useData } from '../contexts/DataContext';
import { DEFAULT_ROUTINE, TIME_SLOTS, QUICK_TASKS } from '../data/constants';
import { usePersistedState } from '../hooks/usePersistedState';
import { useWeatherToday, buildWeatherTasks } from '../utils/weather';
import { generateAftercareTasks } from '../utils/aftercare';
import { fmtFull } from '../utils/date';
import AppShell, { SubHeader } from '../components/AppShell';
import { F } from '../data/fonts';
import NativeDateField from '../components/NativeDateField';
import { useUserId } from '../hooks/useUserId';
import {
  syncDailyCompleted, loadDailyCompleted, removeDailyCompleted,
  syncDailyCustomTasks, loadDailyCustomTasks, removeDailyCustomTask,
  syncDailyRoutine, loadDailyRoutine,
  syncDailyPhoto, removeDailyPhoto, loadDailyPhotos,
} from '../utils/sync';

type RoutineItem = { time: string; task: string; icon?: string };
type CustomTask = { time: string; task: string; icon: string; id: string };
type TaskItem = {
  time: string;
  task: string;
  icon?: string;
  id: string;
  source: string;
  isWeather?: boolean;
};

const ROUTINE_ICONS = ['💧', '☀️', '🌙', '🧴', '🌿', '🧼', '💆', '🌊', '🛡️', '✨'];

function RoutineEditor({
  routine,
  onChange,
  onClose,
}: {
  routine: RoutineItem[];
  onChange: (r: RoutineItem[]) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<RoutineItem[]>(routine);
  const [newTime, setNewTime] = useState('09:00');
  const [newTask, setNewTask] = useState('');
  const [newIcon, setNewIcon] = useState('💧');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const addItem = () => {
    if (!newTask.trim()) return;
    setEditing((prev) => [...prev, { time: newTime, task: newTask.trim(), icon: newIcon }]);
    setNewTask('');
  };

  const removeItem = (idx: number) => setEditing((prev) => prev.filter((_, i) => i !== idx));

  const save = () => {
    onChange(editing);
    onClose();
  };

  const reset = () => setEditing(DEFAULT_ROUTINE as RoutineItem[]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.bottomSheet} activeOpacity={1} onPress={() => {}}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>내 기본 루틴</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={s.sheetDesc}>매일 반복되는 내 스킨케어 루틴이에요.</Text>
          <ScrollView style={{ maxHeight: 260 }}>
            {editing.map((r, i) => (
              <View key={i} style={s.routineRow}>
                <Text style={s.routineTime}>{r.time}</Text>
                <Text style={{ fontSize: 14 }}>{r.icon || '💧'}</Text>
                <Text style={s.routineTask}>{r.task}</Text>
                <TouchableOpacity onPress={() => removeItem(i)} style={s.miniBtn}>
                  <Ionicons name="close" size={13} color={C.textLight} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={s.addSection}>
            <Text style={s.addLabel}>새 항목 추가</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <TouchableOpacity
                style={s.pickerBtn}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <Text style={{ fontSize: 12, color: C.text }}>{newTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.pickerBtn}
                onPress={() => setShowIconPicker(!showIconPicker)}
              >
                <Text style={{ fontSize: 14 }}>{newIcon}</Text>
              </TouchableOpacity>
            </View>
            {showTimePicker && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {TIME_SLOTS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[s.timeChip, newTime === t && s.timeChipActive]}
                      onPress={() => {
                        setNewTime(t);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={[s.timeChipText, newTime === t && s.timeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {showIconPicker && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {ROUTINE_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[s.iconChip, newIcon === ic && { borderColor: C.text }]}
                    onPress={() => {
                      setNewIcon(ic);
                      setShowIconPicker(false);
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                value={newTask}
                onChangeText={setNewTask}
                placeholder="예: 비타민C 세럼"
                placeholderTextColor={C.textMuted}
                style={s.addInput}
              />
              <TouchableOpacity
                onPress={addItem}
                disabled={!newTask.trim()}
                style={[s.addBtn, !newTask.trim() && { backgroundColor: C.borderStrong }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: C.bg }}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            <TouchableOpacity style={s.resetBtn} onPress={reset}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: C.textMuted }}>기본값으로</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={save}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.bg }}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function AddTaskModal({
  visible,
  time,
  onClose,
  onSelectTime,
  onAddQuick,
  onAddCustom,
}: {
  visible: boolean;
  time: string | null;
  onClose: () => void;
  onSelectTime: (t: string) => void;
  onAddQuick: (task: string) => void;
  onAddCustom: (task: string) => void;
}) {
  const [customInput, setCustomInput] = useState('');

  const handleAdd = () => {
    if (time && customInput.trim()) {
      onAddCustom(customInput.trim());
      setCustomInput('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity
        style={s.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          onClose();
          setCustomInput('');
        }}
      >
        <TouchableOpacity style={s.bottomSheet} activeOpacity={1} onPress={() => {}}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>케어 추가하기</Text>
            <TouchableOpacity
              onPress={() => {
                onClose();
                setCustomInput('');
              }}
              style={s.closeBtn}
            >
              <Ionicons name="close" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Text style={s.addLabel}>시간</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {TIME_SLOTS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[s.timeChip, time === t && s.timeChipActive]}
                    onPress={() => onSelectTime(t)}
                  >
                    <Text style={[s.timeChipText, time === t && s.timeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Text style={s.addLabel}>자주 쓰는 케어</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_TASKS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[s.quickChip, !time && { opacity: 0.5 }]}
                  disabled={!time}
                  onPress={() => onAddQuick(q)}
                >
                  <Text style={{ fontSize: 12, color: C.text }}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={s.addLabel}>직접 입력</Text>
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              placeholder="예: 비타민 영양제 먹기"
              placeholderTextColor={C.textMuted}
              style={s.modalInput}
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!time || !customInput.trim()}
              style={[
                s.modalAddBtn,
                (!time || !customInput.trim()) && { backgroundColor: C.borderStrong },
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.bg }}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function DailyCare() {
  const router = useRouter();
  const uid = useUserId();
  const { categories: CATEGORIES, treatments: TREATMENTS } = useData();
  const [step, setStep] = usePersistedState<string>('daily:step', 'select');
  const [selectedTreatments, setSelectedTreatments] = usePersistedState<string[]>('daily:treatments', []);
  const [treatmentDate, setTreatmentDate] = usePersistedState<string>(
    'daily:treatmentDate',
    new Date().toISOString().split('T')[0]
  );
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customTasks, setCustomTasks] = usePersistedState<Record<string, CustomTask[]>>('daily:customTasks', {});
  const [dismissedWeather, setDismissedWeather] = usePersistedState<Record<string, string[]>>(
    'daily:dismissedWeather',
    {}
  );
  const { weather: todayWeather, loading: weatherLoading } = useWeatherToday();
  const [completed, setCompleted] = usePersistedState<Record<string, boolean>>('daily:completed', {});
  const [showAddModal, setShowAddModal] = useState<{ time: string | null } | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [routine, setRoutine] = usePersistedState<RoutineItem[]>('daily:routine', DEFAULT_ROUTINE as RoutineItem[]);
  const [showRoutineEdit, setShowRoutineEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      try {
        const [sbCompleted, sbTasks, sbRoutine, sbPhotos] = await Promise.all([
          loadDailyCompleted(uid),
          loadDailyCustomTasks(uid),
          loadDailyRoutine(uid),
          loadDailyPhotos(uid),
        ]);
        if (!mounted) return;
        if (Object.keys(sbCompleted).length > 0) setCompleted(sbCompleted);
        if (Object.keys(sbTasks).length > 0) setCustomTasks(sbTasks);
        if (sbRoutine) setRoutine(sbRoutine);
        if (Object.keys(sbPhotos).length > 0) setPhotos(sbPhotos);

        const keys = await AsyncStorage.getAllKeys();
        const photoKeys = keys.filter((key) => key.startsWith('daily:photo:'));
        if (photoKeys.length > 0 && mounted) {
          const entries = await AsyncStorage.multiGet(photoKeys);
          entries.forEach(([key, value]) => {
            if (!value) return;
            const dateKey = key.replace('daily:photo:', '');
            if (!sbPhotos[dateKey]) {
              const uri = JSON.parse(value);
              setPhotos((prev) => ({ ...prev, [dateKey]: uri }));
            }
          });
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [uid]);

  const toggleTreatment = (name: string) => {
    setSelectedTreatments((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handlePhotoUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setPhotos((prev) => ({ ...prev, [viewDate]: uri }));
    try {
      await AsyncStorage.setItem('daily:photo:' + viewDate, JSON.stringify(uri));
      if (uid) syncDailyPhoto(uid, viewDate, uri);
    } catch {
      Alert.alert('알림', '사진 용량이 너무 커서 저장하지 못했어요.');
    }
  };

  const removePhoto = async () => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[viewDate];
      return next;
    });
    try {
      await AsyncStorage.removeItem('daily:photo:' + viewDate);
      if (uid) removeDailyPhoto(uid, viewDate);
    } catch {}
  };

  const getTasksForDate = useCallback(
    (dateStr: string): TaskItem[] => {
      const date = new Date(dateStr);
      const tStart = new Date(treatmentDate);
      const dayDiff = Math.floor((date.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24));
      const tasks: TaskItem[] = [];

      routine.forEach((r, i) => {
        tasks.push({
          time: r.time,
          task: r.task,
          icon: r.icon,
          id: 'routine-' + i,
          source: '내 루틴',
        });
      });

      const careMap = new Map<
        string,
        { time: string; task: string; icon?: string; key: string; sources: string[] }
      >();
      selectedTreatments.forEach((t) => {
        const aftercareTasks = generateAftercareTasks(t, dayDiff);
        aftercareTasks.forEach((a: any) => {
          const dedupe = a.time + '|' + a.key;
          if (careMap.has(dedupe)) {
            careMap.get(dedupe)!.sources.push(t);
          } else {
            careMap.set(dedupe, {
              time: a.time,
              task: a.task,
              icon: a.icon,
              key: a.key,
              sources: [t],
            });
          }
        });
      });

      careMap.forEach((c, dedupe) => {
        const source =
          c.sources.length > 1
            ? c.sources.slice(0, 2).join(', ') + (c.sources.length > 2 ? ' 외' : '')
            : c.sources[0];
        tasks.push({
          time: c.time,
          task: c.task,
          icon: c.icon,
          id: 'after-' + dedupe + '-' + dayDiff,
          source,
        });
      });

      (customTasks[dateStr] || []).forEach((ct) => {
        tasks.push({
          time: ct.time,
          task: ct.task,
          icon: ct.icon,
          id: ct.id,
          source: '직접 추가',
        });
      });

      const today = new Date().toISOString().split('T')[0];
      if (dateStr === today && todayWeather) {
        const wTasks = buildWeatherTasks(todayWeather);
        const dismissed = dismissedWeather[today] || [];
        wTasks.forEach((wt) => {
          if (dismissed.includes(wt.condition)) return;
          const id = 'weather-' + wt.condition;
          tasks.push({
            time: wt.time,
            task: wt.task,
            icon: wt.icon,
            id,
            source: '오늘 날씨',
            isWeather: true,
          });
        });
      }

      return tasks;
    },
    [routine, selectedTreatments, customTasks, todayWeather, dismissedWeather, treatmentDate]
  );

  const dismissWeatherTask = (condition: string) => {
    const today = new Date().toISOString().split('T')[0];
    setDismissedWeather((prev) => ({
      ...prev,
      [today]: [...(prev[today] || []), condition],
    }));
  };

  const addCustomTask = (time: string, task: string, icon?: string) => {
    const id = 'custom-' + Date.now();
    const newTask = { time, task, icon: icon || '✨', id };
    setCustomTasks((prev) => {
      const next = { ...prev, [viewDate]: [...(prev[viewDate] || []), newTask] };
      if (uid) syncDailyCustomTasks(uid, next);
      return next;
    });
  };

  const removeTask = (dateStr: string, id: string) => {
    if (id.startsWith('custom-')) {
      setCustomTasks((prev) => ({
        ...prev,
        [dateStr]: (prev[dateStr] || []).filter((t) => t.id !== id),
      }));
      if (uid) removeDailyCustomTask(uid, id);
    } else if (id.startsWith('weather-')) {
      const condition = id.replace('weather-', '');
      dismissWeatherTask(condition);
    }
  };

  const toggleComplete = (dateStr: string, id: string) => {
    const key = dateStr + '-' + id;
    const wasCompleted = completed[key];
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
    if (uid) {
      if (wasCompleted) removeDailyCompleted(uid, key);
      else syncDailyCompleted(uid, { [key]: true });
    }
  };

  const navigateDate = (dir: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + dir);
    setViewDate(d.toISOString().split('T')[0]);
  };

  if (step === 'select') {
    const filteredTreatments = TREATMENTS.filter((t: any) => t.category !== 'filler').filter(
      (t: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const cat = CATEGORIES.find((c: any) => c.key === t.category);
        return (
          t.name.toLowerCase().includes(q) ||
          (t.spec && t.spec.toLowerCase().includes(q)) ||
          (cat && cat.name.toLowerCase().includes(q)) ||
          t.effect.toLowerCase().includes(q)
        );
      }
    );

    return (
      <AppShell currentPage="daily">
        <SubHeader title="데일리 스킨 리스트" onBack={() => router.push('/')} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ paddingTop: 16, paddingBottom: 8, paddingHorizontal: 20 }}>
            <Text style={s.introText}>
              받으신 시술을 선택해주세요. 시술별 에프터 케어를 자동으로 추가해드릴게요. (중복 가능)
            </Text>
            <View style={s.dateCard}>
              <Text style={s.dateLabel}>시술 받은 날짜</Text>
              <NativeDateField
                value={treatmentDate}
                onChange={setTreatmentDate}
                max={new Date().toISOString().split('T')[0]}
                textStyle={s.dateValue}
              />
            </View>
            <TouchableOpacity style={s.routineBtn} onPress={() => setShowRoutineEdit(true)}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>
                  내 기본 루틴 설정
                </Text>
                <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  {routine.length}개 항목 등록됨
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.textLight} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View style={s.searchBox}>
              <Ionicons
                name="search"
                size={14}
                color={C.textLight}
                style={{ position: 'absolute', left: 12, zIndex: 1 }}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="시술명, 카테고리로 검색해주세요"
                placeholderTextColor={C.textLight}
                style={s.searchInput}
              />
            </View>
            <View style={s.selectionInfo}>
              <Text style={s.selectionText}>
                {selectedTreatments.length === 0
                  ? '시술 선택 (중복 가능)'
                  : selectedTreatments.length + '개 시술 선택됨'}
              </Text>
              {selectedTreatments.length > 0 && (
                <TouchableOpacity style={s.resetChip} onPress={() => setSelectedTreatments([])}>
                  <Ionicons name="refresh" size={11} color={C.textMuted} />
                  <Text style={s.selectionText}>선택 초기화</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 6 }}>
            {filteredTreatments.map((t: any) => {
              const isSelected = selectedTreatments.includes(t.name);
              return (
                <TouchableOpacity
                  key={t.name}
                  style={[s.treatmentCard, isSelected && s.treatmentCardActive]}
                  onPress={() => toggleTreatment(t.name)}
                >
                  <View
                    style={[
                      s.checkbox,
                      isSelected && { backgroundColor: C.text, borderColor: C.text },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={12} color={C.bg} />}
                  </View>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: TREATMENT_COLORS[t.name] || C.accent,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium }}>
                      {t.name}
                    </Text>
                    {t.spec && (
                      <Text style={{ fontSize: 10, color: C.textLight, marginTop: 1 }}>
                        {t.spec}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <LinearGradient colors={['rgba(250,247,242,0)', C.bg]} locations={[0, 0.3]} style={s.bottomBar}>
          <TouchableOpacity style={s.startBtn} onPress={() => setStep('routine')}>
            <Text style={s.startBtnText}>
              {selectedTreatments.length === 0
                ? '기본 루틴으로 시작하기'
                : selectedTreatments.length + '개 시술 케어 시작하기'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        {showRoutineEdit && (
          <RoutineEditor
            routine={routine}
            onChange={(r: RoutineItem[]) => { setRoutine(r); if (uid) syncDailyRoutine(uid, r); }}
            onClose={() => setShowRoutineEdit(false)}
          />
        )}
      </AppShell>
    );
  }

  const tasks = getTasksForDate(viewDate).sort((a, b) => a.time.localeCompare(b.time));
  const grouped: Record<string, TaskItem[]> = {};
  tasks.forEach((t) => {
    if (!grouped[t.time]) grouped[t.time] = [];
    grouped[t.time].push(t);
  });
  const sortedTimes = Object.keys(grouped).sort();
  const dateObj = new Date(viewDate);
  const tStart = new Date(treatmentDate);
  const dayDiff = Math.floor((dateObj.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24));
  const todayPhoto = photos[viewDate];
  const isToday = viewDate === new Date().toISOString().split('T')[0];

  return (
    <AppShell currentPage="daily">
      <SubHeader title="데일리 스킨 리스트" onBack={() => setStep('select')} />
      <View style={s.dateNav}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={s.navBtn}>
          <Ionicons name="chevron-back" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: C.text, fontFamily: F.sansMedium }}>
            {fmtFull(dateObj)}
          </Text>
          {selectedTreatments.length > 0 && dayDiff >= 0 && (
            <Text style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>
              시술 후 D+{dayDiff}일
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => navigateDate(1)} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={C.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 14, paddingHorizontal: 20 }}>
          {isToday && (
            <View style={s.weatherCard}>
              <View style={s.weatherHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 11, color: C.accent, fontWeight: '500', letterSpacing: 0.55, fontFamily: F.sansMedium }}>
                    오늘의 날씨
                  </Text>
                  <View style={s.estimateBadge}>
                    <Text style={{ fontSize: 9, color: C.textMuted }}>
                      {weatherLoading ? '불러오는 중' : todayWeather?.isEstimate ? '월별 평균 추정' : '실시간 반영'}
                    </Text>
                  </View>
                </View>
                {todayWeather && todayWeather.seasonNote && (
                  <Text style={{ fontSize: 11, color: C.textMuted }}>{todayWeather.seasonNote}</Text>
                )}
              </View>
              {todayWeather && (
                <View style={s.weatherStats}>
                  {typeof todayWeather.temp === 'number' && (
                    <View style={s.weatherStatItem}>
                      <Text style={s.weatherLabel}>기온 </Text>
                      <Text style={s.weatherValue}>{Math.round(todayWeather.temp)}°</Text>
                    </View>
                  )}
                  {typeof todayWeather.humidity === 'number' && (
                    <View style={s.weatherStatItem}>
                      <Text style={s.weatherLabel}>습도 </Text>
                      <Text style={s.weatherValue}>{Math.round(todayWeather.humidity)}%</Text>
                    </View>
                  )}
                  {typeof todayWeather.uv === 'number' && (
                    <View style={s.weatherStatItem}>
                      <Text style={s.weatherLabel}>UV </Text>
                      <Text
                        style={[
                          s.weatherValue,
                          todayWeather.uv >= 5 && { color: C.danger },
                        ]}
                      >
                        {todayWeather.uv.toFixed(1)}
                        {todayWeather.uv >= 8
                          ? ' 매우높음'
                          : todayWeather.uv >= 5
                          ? ' 높음'
                          : ''}
                      </Text>
                    </View>
                  )}
                  {typeof todayWeather.pm25 === 'number' && (
                    <View style={s.weatherStatItem}>
                      <Text style={s.weatherLabel}>PM2.5 </Text>
                      <Text
                        style={[
                          s.weatherValue,
                          todayWeather.pm25 >= 35 && { color: C.danger },
                        ]}
                      >
                        {Math.round(todayWeather.pm25)}
                        {todayWeather.pm25 >= 75
                          ? ' 매우나쁨'
                          : todayWeather.pm25 >= 35
                          ? ' 나쁨'
                          : ''}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          <Text style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{viewDate === new Date().toISOString().split('T')[0] ? '오늘 피부 사진' : viewDate + ' 피부 사진'}</Text>
          {todayPhoto ? (
            <View style={s.photoContainer}>
              <Image source={{ uri: todayPhoto }} style={s.photoImage} />
              <TouchableOpacity style={s.photoDeleteBtn} onPress={removePhoto}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.photoPlaceholder} onPress={handlePhotoUpload}>
              <Ionicons name="image-outline" size={24} color={C.accent} />
              <Text style={{ fontSize: 12, color: C.text, fontWeight: '500', fontFamily: F.sansMedium }}>
                오늘 피부 기록하기
              </Text>
              <Text style={{ fontSize: 10, color: C.textMuted }}>
                매일 같은 조건에서 찍으면 변화가 잘 보여요
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {selectedTreatments.length > 0 && (
          <View style={s.treatmentTags}>
            {selectedTreatments.map((t) => (
              <View key={t} style={s.treatmentTag}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: TREATMENT_COLORS[t] || C.accent,
                  }}
                />
                <Text style={{ fontSize: 11, fontWeight: '500', color: C.accent, fontFamily: F.sansMedium }}>{t}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ padding: 16, paddingHorizontal: 20 }}>
          {sortedTimes.map((time) => (
            <View key={time} style={{ marginBottom: 18 }}>
              <View style={s.timeHeader}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.text, fontFamily: F.sansMedium }}>{time}</Text>
                <TouchableOpacity
                  style={s.timeAddBtn}
                  onPress={() => setShowAddModal({ time })}
                >
                  <Ionicons name="add" size={11} color={C.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 6 }}>
                {grouped[time].map((t) => {
                  const key = viewDate + '-' + t.id;
                  const isDone = completed[key];
                  return (
                    <View
                      key={t.id}
                      style={[s.taskCard, t.isWeather && { borderColor: C.accent }]}
                    >
                      {t.isWeather && <View style={s.weatherIndicator} />}
                      <TouchableOpacity
                        onPress={() => toggleComplete(viewDate, t.id)}
                        style={[
                          s.taskCheckbox,
                          isDone && { backgroundColor: C.accent, borderColor: C.accent },
                        ]}
                      >
                        {isDone && <Ionicons name="checkmark" size={13} color={C.bg} />}
                      </TouchableOpacity>
                      <Text style={{ fontSize: 16 }}>{t.icon || '✨'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            s.taskText,
                            isDone && { color: C.textLight, textDecorationLine: 'line-through' },
                          ]}
                        >
                          {t.task}
                        </Text>
                        <Text
                          style={[
                            s.taskSource,
                            t.isWeather && { color: C.accent, fontWeight: '500' },
                          ]}
                        >
                          {t.source}
                        </Text>
                      </View>
                      {(t.id.startsWith('custom-') || t.id.startsWith('weather-')) && (
                        <TouchableOpacity
                          onPress={() => removeTask(viewDate, t.id)}
                          style={s.miniBtn}
                        >
                          <Ionicons name="close" size={13} color={C.textLight} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={s.addTaskBtn}
            onPress={() => setShowAddModal({ time: null })}
          >
            <Ionicons name="add" size={14} color={C.textMuted} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.textMuted, fontFamily: F.sansMedium }}>
              새로운 케어 추가하기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AddTaskModal
        visible={!!showAddModal}
        time={showAddModal?.time ?? null}
        onClose={() => setShowAddModal(null)}
        onSelectTime={(t) => setShowAddModal({ time: t })}
        onAddQuick={(task) => {
          if (showAddModal?.time) {
            addCustomTask(showAddModal.time, task);
            setShowAddModal(null);
          }
        }}
        onAddCustom={(task) => {
          if (showAddModal?.time) {
            addCustomTask(showAddModal.time, task);
            setShowAddModal(null);
          }
        }}
      />
    </AppShell>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  introText: { fontSize: 13, color: C.textMuted, lineHeight: 20.8, letterSpacing: 0.55, marginBottom: 16 },
  dateCard: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  dateLabel: { fontSize: 11, color: C.textMuted, marginBottom: 6 },
  dateValue: { fontSize: 14, color: C.text },
  routineBtn: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBox: { position: 'relative', justifyContent: 'center', marginBottom: 10 },
  searchInput: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    fontSize: 12,
    color: C.text,
    paddingVertical: 10,
    paddingLeft: 34,
    paddingRight: 12,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionText: { fontSize: 11, color: C.textMuted, fontFamily: F.sansMedium },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    borderRadius: 999,
  },
  treatmentCard: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  treatmentCardActive: { backgroundColor: C.accentBg, borderColor: C.borderStrong },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  startBtn: {
    backgroundColor: C.text,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 15, fontWeight: '500', color: C.bg, fontFamily: F.sansMedium },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherCard: {
    marginBottom: 14,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  estimateBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: C.soft,
    borderRadius: 999,
  },
  weatherStats: { flexDirection: 'row', gap: 14, marginTop: 8, flexWrap: 'wrap' },
  weatherStatItem: { flexDirection: 'row', alignItems: 'center' },
  weatherLabel: { fontSize: 10, color: C.textMuted },
  weatherValue: { fontSize: 12, color: C.text, fontWeight: '500', fontFamily: F.sansMedium },
  photoContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  photoImage: { width: '100%', maxHeight: 240 },
  photoDeleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    padding: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.borderStrong,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
  },
  treatmentTags: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  treatmentTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: C.accentBg,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeAddBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCard: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  weatherIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.accent,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskText: { fontSize: 13, color: C.text, fontWeight: '500', fontFamily: F.sansMedium },
  taskSource: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  addTaskBtn: {
    padding: 14,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: C.borderStrong,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxWidth: 420,
    width: '100%',
    padding: 20,
    paddingHorizontal: 22,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '500', color: C.text, fontFamily: F.sansMedium },
  sheetDesc: { fontSize: 12, color: C.textMuted, lineHeight: 18.5, marginBottom: 16 },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    marginBottom: 6,
  },
  routineTime: { fontSize: 11, color: C.accent, fontWeight: '500', minWidth: 40, fontFamily: F.sansMedium },
  routineTask: { flex: 1, fontSize: 13, color: C.text },
  addSection: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  addLabel: { fontSize: 11, color: C.textMuted, marginBottom: 8 },
  addInput: {
    flex: 1,
    padding: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.bg,
    color: C.text,
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: C.text,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  iconChip: {
    padding: 6,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  timeChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 999,
  },
  timeChipActive: { backgroundColor: C.text, borderColor: C.text },
  timeChipText: { fontSize: 12, color: C.textMuted, fontWeight: '500', fontFamily: F.sansMedium },
  timeChipTextActive: { color: C.bg },
  quickChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 999,
  },
  modalInput: {
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    fontSize: 13,
    color: C.text,
    padding: 12,
    paddingHorizontal: 14,
  },
  modalAddBtn: {
    marginTop: 10,
    padding: 12,
    backgroundColor: C.text,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 0.5,
    borderColor: C.borderStrong,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    padding: 12,
    backgroundColor: C.text,
    borderRadius: 12,
    alignItems: 'center',
  },
});

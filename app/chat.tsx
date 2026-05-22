import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { useData } from '../contexts/DataContext';
import { usePersistedState } from '../hooks/usePersistedState';
import AppShell from '../components/AppShell';

const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';

const QUICK_PROMPTS = [
  '내 시술 일정 요약해줘',
  '리쥬란이랑 스킨바이브 차이가 뭐야?',
  '강남에 모공 시술 잘하는 곳 추천해줘',
  '포텐자랑 같이 받아도 되는 시술 알려줘',
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const { categories: CATEGORIES, treatments: TREATMENTS, hospitals: HOSPITALS } = useData();
  const [messages, setMessages] = usePersistedState<Message[]>('chat:messages', []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [contextData, setContextData] = useState<Record<string, any>>({});
  const scrollRef = useRef<ScrollView>(null);
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!loading) return;
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); dot1.setValue(0.3); dot2.setValue(0.3); dot3.setValue(0.3); };
  }, [loading]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ctx: Record<string, any> = {};
      const keys = [
        'manager:counts', 'manager:schedule', 'manager:startDate',
        'manager:pastTreatments', 'daily:treatments', 'daily:treatmentDate', 'reviews:all',
      ];
      for (const key of keys) {
        try {
          const val = await AsyncStorage.getItem(key);
          if (val) ctx[key] = JSON.parse(val);
        } catch {}
      }
      if (mounted) setContextData(ctx);
    })();
    return () => { mounted = false; };
  }, [messages.length]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const buildSystemPrompt = () => {
    const txByCat: Record<string, string[]> = {};
    TREATMENTS.forEach(t => {
      const catName = (CATEGORIES.find(c => c.key === t.category) || { name: t.category }).name;
      if (!txByCat[catName]) txByCat[catName] = [];
      txByCat[catName].push(`${t.name} (${t.spec || ''}): ${t.effect}, 통증 ${t.pain}/10, 다운타임 ${t.downtime}, 권장 ${t.sessions}, 가격 ${t.price}`);
    });
    const treatmentSection = Object.entries(txByCat).map(([cat, items]) =>
      `## ${cat}\n${items.map(i => '- ' + i).join('\n')}`
    ).join('\n\n');

    const hospByArea: Record<string, string[]> = {};
    HOSPITALS.forEach(h => {
      if (!hospByArea[h.area]) hospByArea[h.area] = [];
      hospByArea[h.area].push(`${h.name} (${h.address}, ${h.phone})`);
    });
    const hospitalSection = Object.entries(hospByArea).map(([area, items]) =>
      `## ${area}\n${items.map(i => '- ' + i).join('\n')}`
    ).join('\n\n');

    const userParts: string[] = [];
    const counts = contextData['manager:counts'] || {};
    const selectedNames = Object.keys(counts).filter(k => counts[k] > 0);
    if (selectedNames.length > 0) {
      userParts.push('스킨 매니저에 등록된 시술 계획:');
      selectedNames.forEach(n => userParts.push(`  - ${n}: ${counts[n]}회`));
      if (contextData['manager:startDate']) userParts.push(`  시작일: ${contextData['manager:startDate']}`);
    }
    const dailyTx = contextData['daily:treatments'] || [];
    if (dailyTx.length > 0) {
      userParts.push(`데일리 케어 중인 시술: ${dailyTx.join(', ')} (시술일: ${contextData['daily:treatmentDate'] || '미설정'})`);
    }
    const past = contextData['manager:pastTreatments'] || [];
    if (past.length > 0) {
      userParts.push(`과거에 받은 시술 기록 (${past.length}건):`);
      const byName: Record<string, string[]> = {};
      past.forEach((p: any) => {
        if (!byName[p.name]) byName[p.name] = [];
        byName[p.name].push(p.date);
      });
      Object.entries(byName).forEach(([name, dates]) => {
        const sorted = dates.map(d => typeof d === 'string' ? d.split('T')[0] : d).sort();
        userParts.push(`  - ${name}: ${dates.length}회 (${sorted.join(', ')})`);
      });
    }
    const reviews = contextData['reviews:all'] || {};
    const userWritten: string[] = [];
    Object.entries(reviews).forEach(([id, list]: [string, any]) => {
      const userOnes = list.filter((r: any) => new Date(r.date).getFullYear() >= 2025);
      if (userOnes.length > 0) {
        const h = HOSPITALS.find(x => x.id === parseInt(id));
        if (h) userWritten.push(`${h.name}: ${userOnes.length}개 리뷰 (평균 ${(userOnes.reduce((s: number, r: any) => s + r.rating, 0) / userOnes.length).toFixed(1)}점)`);
      }
    });
    if (userWritten.length > 0) {
      userParts.push('직접 방문하고 리뷰 작성한 병원:');
      userWritten.forEach(u => userParts.push('  - ' + u));
    }
    const userSection = userParts.length > 0 ? userParts.join('\n') : '아직 매니저나 데일리에 등록된 정보가 없어요.';

    return `당신은 'NO실장'이라는 한국 피부 시술 전문 AI 컨시어지입니다. 사용자의 피부 고민과 시술 선택을 친근하게 도와줍니다.

# 톤 & 매너
- 한국어로 답변, 친근하지만 전문적
- 모바일 채팅이라 답변은 간결하게 (길어도 5-6문장)
- 의학적 진단/처방 X. 필요시 "전문의 상담을 권해요"
- 가격은 대략적인 가이드라고 안내
- 사용자 데이터(매니저, 리뷰)가 있으면 그걸 참고해서 개인화된 답변
- 추천할 때는 1-2개로 좁혀서, 이유와 함께
- 마크다운(*, #, -)은 피하고 자연스러운 문장으로

# 시술 데이터베이스
${treatmentSection}

# 등록된 병원 데이터베이스
${hospitalSection}

# 사용자 현재 상태
${userSection}`;
  };

  const send = async (text?: string) => {
    const content = (text !== undefined ? text : input).trim();
    if (!content || loading) return;
    const userMsg: Message = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: buildSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('API ' + response.status + ': ' + errText.slice(0, 200));
      }
      const data = await response.json();
      const assistantText = (data.content || []).map((c: any) => c.text || '').filter(Boolean).join('') || '응답을 받지 못했어요. 다시 시도해주세요.';
      setMessages([...newMessages, { role: 'assistant', content: assistantText }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: '죄송해요, 잠시 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.\n\n(' + (err.message || '알 수 없는 오류') + ')' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell currentPage="chat">
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerTitle}>NO실장 AI</Text>
          <Text style={styles.headerSub}>피부 시술 컨시어지</Text>
        </View>
        {messages.length > 0 ? (
          <TouchableOpacity onPress={() => setShowClearConfirm(true)} style={{ padding: 4 }}>
            <Ionicons name="refresh-outline" size={18} color={C.textMuted} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View>
              <View style={styles.emptyWrap}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>N</Text>
                </View>
                <Text style={styles.emptyTitle}>안녕하세요</Text>
                <Text style={styles.emptyDesc}>시술이나 병원, 케어에 대해{'\n'}편하게 물어봐주세요.</Text>
              </View>
              <Text style={styles.quickLabel}>이렇게 물어볼 수 있어요</Text>
              {QUICK_PROMPTS.map(q => (
                <TouchableOpacity
                  key={q}
                  onPress={() => send(q)}
                  disabled={loading}
                  style={[styles.quickBtn, loading && { opacity: 0.5 }]}
                >
                  <Text style={styles.quickBtnText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map((m, i) => (
            <View key={i} style={[styles.msgRow, m.role === 'user' ? styles.msgRowUser : styles.msgRowAssistant]}>
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, m.role === 'user' && { color: C.bg }]}>{m.content}</Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.msgRow, styles.msgRowAssistant]}>
              <View style={[styles.bubble, styles.bubbleAssistant, { flexDirection: 'row', gap: 4, paddingVertical: 12, paddingHorizontal: 14 }]}>
                <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
                <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
                <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={C.textLight}
            editable={!loading}
            multiline
            style={styles.textInput}
            onSubmitEditing={() => send()}
            blurOnSubmit
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && { backgroundColor: C.borderStrong }]}
          >
            <Ionicons name="send" size={16} color={C.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showClearConfirm} transparent animationType="fade" onRequestClose={() => setShowClearConfirm(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClearConfirm(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
            <Text style={styles.modalTitle}>대화 기록을 지울까요?</Text>
            <Text style={styles.modalDesc}>지금까지의 대화가 모두 삭제돼요. 되돌릴 수 없어요.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowClearConfirm(false)} style={styles.modalCancelBtn}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setMessages([]); setShowClearConfirm(false); }} style={styles.modalDeleteBtn}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.bg }}>지우기</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle: { fontSize: 14, fontWeight: '500', color: C.text, letterSpacing: 0.28, fontFamily: F.sansMedium },
  headerSub: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  emptyWrap: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, color: C.accent, fontFamily: F.serifMedium, marginTop: -1 },
  emptyTitle: { fontSize: 15, fontWeight: '500', color: C.text, marginBottom: 6, fontFamily: F.sansMedium },
  emptyDesc: { fontSize: 12, color: C.textMuted, lineHeight: 19.2, textAlign: 'center' },
  quickLabel: { fontSize: 11, color: C.textMuted, marginBottom: 8, marginLeft: 4 },
  quickBtn: { padding: 10, paddingHorizontal: 14, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, marginBottom: 6 },
  quickBtnText: { fontSize: 12.5, color: C.text, lineHeight: 17.5, fontFamily: F.sansMedium },
  msgRow: { marginBottom: 10 },
  msgRowUser: { alignItems: 'flex-end' },
  msgRowAssistant: { alignItems: 'flex-start' },
  bubble: { maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 13 },
  bubbleUser: { backgroundColor: C.text, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 4, borderBottomRightRadius: 16 },
  bubbleText: { fontSize: 13, lineHeight: 20.15, color: C.text },
  inputBar: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderTopWidth: 0.5, borderTopColor: C.border, backgroundColor: C.bg },
  textInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 18, fontSize: 13, color: C.text, maxHeight: 100, lineHeight: 18 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: C.bg, borderRadius: 18, maxWidth: 320, width: '100%', padding: 22, paddingBottom: 18 },
  modalTitle: { fontSize: 15, fontWeight: '500', color: C.text, marginBottom: 8, fontFamily: F.sansMedium },
  modalDesc: { fontSize: 12, color: C.textMuted, lineHeight: 18.6, marginBottom: 18 },
  modalBtns: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: { flex: 1, padding: 11, backgroundColor: 'transparent', borderWidth: 0.5, borderColor: C.borderStrong, borderRadius: 12, alignItems: 'center' },
  modalDeleteBtn: { flex: 1, padding: 11, backgroundColor: C.danger, borderRadius: 12, alignItems: 'center' },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.textLight },
});

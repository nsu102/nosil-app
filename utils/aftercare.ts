import { getTreatment } from '../data/treatments';

interface AftercarTask {
  time: string;
  task: string;
  icon: string;
  key: string;
}

export const generateAftercareTasks = (treatmentName: string, dayDiff: number): AftercarTask[] => {
  const t = getTreatment(treatmentName);
  if (!t || !t.aftercare) return [];
  const tasks: AftercarTask[] = [];
  if (dayDiff === 0) {
    if (t.aftercare.includes('냉찜질') || t.aftercare.includes('쿨링')) {
      tasks.push({ time: '22:00', task: '쿨링/냉찜질로 진정', icon: '❄️', key: 'cooling' });
    }
    if (t.aftercare.includes('재생크림')) {
      tasks.push({ time: '22:00', task: '재생크림 도포', icon: '🧴', key: 'regen' });
    }
    if (t.aftercare.includes('진정')) {
      tasks.push({ time: '22:00', task: '진정 케어', icon: '🌿', key: 'soothing' });
    }
    if (t.aftercare.includes('압박 피하기')) {
      tasks.push({ time: '22:00', task: '시술 부위 압박 피하기', icon: '⚠️', key: 'no-press' });
    }
    if (t.avoid_act) {
      const shortAvoid = t.avoid_act.split(',').slice(0, 3).join(',').trim();
      tasks.push({ time: '22:00', task: '오늘 피하기: ' + shortAvoid, icon: '🚫', key: 'avoid-' + treatmentName });
    }
  }
  if (dayDiff >= 1 && dayDiff <= 7) {
    if (t.aftercare.includes('재생크림')) {
      tasks.push({ time: '09:00', task: '재생크림 도포', icon: '🧴', key: 'regen-am' });
      tasks.push({ time: '22:00', task: '재생크림 도포', icon: '🧴', key: 'regen-pm' });
    }
    if (t.aftercare.includes('보습') || t.aftercare.includes('수분')) {
      tasks.push({ time: '09:00', task: '보습제 충분히 바르기', icon: '💧', key: 'moist' });
    }
    if (t.aftercare.includes('진정')) {
      tasks.push({ time: '22:00', task: '진정 케어 (마스크/토너)', icon: '🌿', key: 'soothing' });
    }
    if (t.aftercare.includes('선크림') || t.aftercare.includes('SPF') || t.aftercare.includes('자외선')) {
      tasks.push({ time: '09:00', task: '자외선 차단제 꼼꼼히', icon: '☀️', key: 'sun-am' });
      tasks.push({ time: '12:00', task: '자외선 차단제 덧바르기', icon: '☀️', key: 'sun-noon' });
    }
    if (t.aftercare.includes('압박 피하기')) {
      tasks.push({ time: '22:00', task: '시술 부위 압박 피하기', icon: '⚠️', key: 'no-press' });
    }
    if (t.aftercare.includes('장벽크림')) {
      tasks.push({ time: '22:00', task: '장벽크림 도포', icon: '🛡️', key: 'barrier' });
    }
    if (t.aftercare.includes('LDM')) {
      tasks.push({ time: '12:00', task: 'LDM 진정 관리 고려', icon: '🌊', key: 'ldm' });
    }
    if (t.aftercare.includes('시카크림')) {
      tasks.push({ time: '22:00', task: '시카크림 도포', icon: '🌱', key: 'cica' });
    }
  }
  if (dayDiff >= 1 && dayDiff <= 3 && t.avoid_act) {
    const shortAvoid = t.avoid_act.split(',').slice(0, 3).join(',').trim();
    tasks.push({ time: '22:00', task: '오늘 피하기: ' + shortAvoid, icon: '🚫', key: 'avoid-' + treatmentName });
  }
  return tasks;
};

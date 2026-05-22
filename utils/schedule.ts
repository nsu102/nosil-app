import { getTreatment } from '../data/treatments';
import { addDays } from './date';

export const normalizeName = (s: string): string =>
  s.replace(/\s+/g, '').toLowerCase();

export const checkRelation = (a: string, b: string): 'good' | 'avoid' | 'neutral' => {
  if (a === b) return 'neutral';
  const tA = getTreatment(a);
  const tB = getTreatment(b);
  if (!tA || !tB) return 'neutral';
  const nA = normalizeName(a);
  const nB = normalizeName(b);
  const aGood = tA.good.some((g: string) => normalizeName(g) === nB);
  const bGood = tB.good.some((g: string) => normalizeName(g) === nA);
  if (aGood || bGood) return 'good';
  const aAvoid = tA.avoid.some((g: string) => {
    const ng = normalizeName(g.replace(/직후|과다/g, '').trim());
    return ng && (ng.includes(nB) || nB.includes(ng));
  });
  const bAvoid = tB.avoid.some((g: string) => {
    const ng = normalizeName(g.replace(/직후|과다/g, '').trim());
    return ng && (ng.includes(nA) || nA.includes(ng));
  });
  if (aAvoid || bAvoid) return 'avoid';
  return 'neutral';
};

interface ScheduleItem {
  name: string;
  count: number;
}

interface ScheduleEvent {
  date: Date;
  name: string;
}

export const generateSchedule = (selected: ScheduleItem[], startDate: Date): ScheduleEvent[] => {
  const remaining = selected.map(s => {
    const t = getTreatment(s.name);
    return {
      name: s.name,
      left: s.count,
      interval: t?.interval ?? 4,
      distance: t?.distance ?? 2,
      lastDate: null as Date | null,
    };
  });
  const events: ScheduleEvent[] = [];
  let lastDate: Date | null = null;
  let lastName: string | null = null;
  let safety = 0;
  while (remaining.some(t => t.left > 0) && safety < 300) {
    safety++;
    let bestT: typeof remaining[0] | null = null;
    let bestD: Date | null = null;
    for (const t of remaining) {
      if (t.left === 0) continue;
      let earliest: Date;
      if (t.lastDate === null) {
        earliest = lastDate ? addDays(lastDate, t.distance * 7) : new Date(startDate);
      } else {
        earliest = addDays(t.lastDate, t.interval * 7);
      }
      if (lastDate && lastName && lastName !== t.name) {
        const lastT = getTreatment(lastName);
        const minDist = Math.max(t.distance, lastT?.distance ?? 2);
        const minAfter = addDays(lastDate, minDist * 7);
        if (earliest < minAfter) earliest = minAfter;
      }
      if (!bestD || earliest < bestD) { bestD = earliest; bestT = t; }
    }
    events.push({ date: bestD!, name: bestT!.name });
    bestT!.lastDate = bestD;
    bestT!.left -= 1;
    lastDate = bestD;
    lastName = bestT!.name;
  }
  return events;
};

export const analyzeCombo = (names: string[]): { goods: [string, string][]; avoids: [string, string][] } => {
  const goods: [string, string][] = [];
  const avoids: [string, string][] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const rel = checkRelation(names[i], names[j]);
      if (rel === 'good') goods.push([names[i], names[j]]);
      else if (rel === 'avoid') avoids.push([names[i], names[j]]);
    }
  }
  return { goods, avoids };
};

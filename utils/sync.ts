import { supabase } from '../lib/supabase';

export async function syncDailyCompleted(uid: string, completed: Record<string, boolean>) {
  const rows = Object.entries(completed)
    .filter(([, v]) => v)
    .map(([key]) => {
      const sep = key.indexOf('-');
      return { uid, date_key: key.substring(0, 10), task_id: key };
    });
  if (rows.length === 0) return;
  await supabase.from('daily_completed').upsert(rows, { onConflict: 'uid,date_key,task_id' });
}

export async function loadDailyCompleted(uid: string): Promise<Record<string, boolean>> {
  const { data } = await supabase.from('daily_completed').select('task_id').eq('uid', uid);
  const map: Record<string, boolean> = {};
  data?.forEach((r: any) => { map[r.task_id] = true; });
  return map;
}

export async function removeDailyCompleted(uid: string, taskId: string) {
  await supabase.from('daily_completed').delete().eq('uid', uid).eq('task_id', taskId);
}

export async function syncDailyCustomTasks(uid: string, tasks: Record<string, any[]>) {
  const rows: any[] = [];
  Object.entries(tasks).forEach(([dateKey, list]) => {
    list.forEach((t: any) => {
      rows.push({ uid, date_key: dateKey, task_time: t.time, task_text: t.task, task_icon: t.icon || '✨', task_id: t.id });
    });
  });
  if (rows.length === 0) return;
  await supabase.from('daily_custom_tasks').upsert(rows, { onConflict: 'uid,task_id' });
}

export async function loadDailyCustomTasks(uid: string): Promise<Record<string, any[]>> {
  const { data } = await supabase.from('daily_custom_tasks').select('*').eq('uid', uid);
  const map: Record<string, any[]> = {};
  data?.forEach((r: any) => {
    if (!map[r.date_key]) map[r.date_key] = [];
    map[r.date_key].push({ time: r.task_time, task: r.task_text, icon: r.task_icon, id: r.task_id });
  });
  return map;
}

export async function removeDailyCustomTask(uid: string, taskId: string) {
  await supabase.from('daily_custom_tasks').delete().eq('uid', uid).eq('task_id', taskId);
}

export async function syncDailyRoutine(uid: string, routine: any[]) {
  await supabase.from('daily_routines').upsert({ uid, routine, updated_at: new Date().toISOString() }, { onConflict: 'uid' });
}

export async function loadDailyRoutine(uid: string): Promise<any[] | null> {
  const { data } = await supabase.from('daily_routines').select('routine').eq('uid', uid).single();
  return data?.routine || null;
}

export async function syncDailyPhoto(uid: string, dateKey: string, photoUrl: string) {
  await supabase.from('daily_photos').upsert({ uid, date_key: dateKey, photo_url: photoUrl }, { onConflict: 'uid,date_key' });
}

export async function removeDailyPhoto(uid: string, dateKey: string) {
  await supabase.from('daily_photos').delete().eq('uid', uid).eq('date_key', dateKey);
}

export async function loadDailyPhotos(uid: string): Promise<Record<string, string>> {
  const { data } = await supabase.from('daily_photos').select('date_key,photo_url').eq('uid', uid);
  const map: Record<string, string> = {};
  data?.forEach((r: any) => { map[r.date_key] = r.photo_url; });
  return map;
}

export async function syncTreatmentRecord(uid: string, record: {
  step: string;
  counts: Record<string, number>;
  startDate: string;
  schedule: any[];
  pastTreatments: any[];
}) {
  await supabase.from('treatment_records').upsert({
    uid,
    step: record.step,
    counts: record.counts,
    start_date: record.startDate,
    schedule: record.schedule.map((e: any) => ({ name: e.name, date: e.date instanceof Date ? e.date.toISOString() : e.date })),
    past_treatments: record.pastTreatments.map((e: any) => ({ name: e.name, date: e.date instanceof Date ? e.date.toISOString() : e.date })),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'uid' });
}

export async function loadTreatmentRecord(uid: string) {
  const { data } = await supabase.from('treatment_records').select('*').eq('uid', uid).single();
  if (!data) return null;
  return {
    step: data.step,
    counts: data.counts as Record<string, number>,
    startDate: data.start_date,
    schedule: (data.schedule as any[]).map((e: any) => ({ name: e.name, date: new Date(e.date) })),
    pastTreatments: (data.past_treatments as any[]).map((e: any) => ({ name: e.name, date: new Date(e.date) })),
  };
}

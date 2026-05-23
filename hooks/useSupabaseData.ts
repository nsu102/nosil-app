import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Treatment, TreatmentTip } from '../data/treatments';
import { Hospital } from '../data/hospitals';
import { Review } from '../data/reviews';

type Category = { key: string; name: string };
type ConcernData = Record<string, { primary: string[]; secondary: string[]; desc: string }>;
type DosageInfo = { event: string; recommended: string; unit: string };

export function useSupabaseData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [concerns, setConcerns] = useState<ConcernData>({});
  const [reviews, setReviews] = useState<Record<number, Review[]>>({});
  const [dosage, setDosage] = useState<Record<string, DosageInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [catRes, treatRes, hospRes, concernRes, reviewRes, dosageRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('treatments').select('*'),
        supabase.from('hospitals').select('*').order('id'),
        supabase.from('concern_data').select('*'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('dosage_guide').select('*'),
      ]);

      if (catRes.data) {
        setCategories(catRes.data.map((c: any) => ({ key: c.key, name: c.name })));
      }

      if (treatRes.data) {
        setTreatments(treatRes.data.map((t: any): Treatment => ({
          name: t.name,
          category: t.category,
          spec: t.spec || '',
          desc: t.description || '',
          concerns: t.concerns || [],
          interval: t.interval_weeks || 0,
          distance: t.distance || 0,
          effect: t.effect || '',
          pain: t.pain || 0,
          downtime: t.downtime || '',
          duration: t.duration || '',
          sessions: t.sessions || '',
          good: t.good || [],
          avoid: t.avoid || [],
          aftercare: t.aftercare || '',
          avoid_act: t.avoid_act || '',
          caution: t.caution || '',
          price: t.price || '',
          range: t.price_range || '',
          eventDose: t.event_dose || '',
          effectiveDose: t.effective_dose || '',
          tips: t.tips as TreatmentTip[] | undefined,
        })));
      }

      if (hospRes.data) {
        setHospitals(hospRes.data.map((h: any): Hospital => ({
          id: h.id,
          name: h.name,
          area: h.area || '',
          address: h.address || '',
          phone: h.phone || '',
        })));
      }

      if (concernRes.data) {
        const map: ConcernData = {};
        concernRes.data.forEach((c: any) => {
          map[c.concern] = {
            primary: c.primary_treatments || [],
            secondary: c.secondary_treatments || [],
            desc: c.description || '',
          };
        });
        setConcerns(map);
      }

      if (reviewRes.data) {
        const map: Record<number, Review[]> = {};
        reviewRes.data.forEach((r: any) => {
          if (!map[r.hospital_id]) map[r.hospital_id] = [];
          map[r.hospital_id].push({
            rating: r.rating,
            text: r.text || '',
            date: r.created_at,
            photoPaths: r.photo_paths || [],
          });
        });
        setReviews(map);
      }

      if (dosageRes.data) {
        const map: Record<string, DosageInfo> = {};
        dosageRes.data.forEach((d: any) => {
          map[d.treatment_name] = {
            event: d.event,
            recommended: d.recommended,
            unit: d.unit,
          };
        });
        setDosage(map);
      }
    } catch (e) {
      console.error('Supabase load error:', e);
    } finally {
      setLoading(false);
    }
  }

  const getTreatment = (name: string) => treatments.find((t) => t.name === name);

  return { categories, treatments, hospitals, concerns, reviews, dosage, loading, getTreatment };
}

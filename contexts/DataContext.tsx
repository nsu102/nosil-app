import React, { createContext, useContext } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Treatment } from '../data/treatments';
import { Hospital } from '../data/hospitals';
import { Review } from '../data/reviews';

type DosageInfo = { event: string; recommended: string; unit: string };
type ConcernData = Record<string, { primary: string[]; secondary: string[]; desc: string }>;

type DataContextType = {
  categories: { key: string; name: string }[];
  treatments: Treatment[];
  hospitals: Hospital[];
  concerns: ConcernData;
  reviews: Record<number, Review[]>;
  dosage: Record<string, DosageInfo>;
  loading: boolean;
  getTreatment: (name: string) => Treatment | undefined;
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = useSupabaseData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

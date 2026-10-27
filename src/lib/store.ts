import { create } from 'zustand';
import type { AnalysisResult, PipelineStage } from '../types';

interface AnalysisStore {
  result: AnalysisResult | null;
  loading: boolean;
  stage: PipelineStage;
  detail: string;
  error: string | null;
  setResult: (result: AnalysisResult | null) => void;
  setProgress: (stage: PipelineStage, detail: string) => void;
  setError: (error: string | null) => void;
}
export const useAnalysisStore = create<AnalysisStore>((set) => ({
  result: null, loading: false, stage: 'reading', detail: '', error: null,
  setResult: (result) => set({ result, loading: false, stage: 'complete', error: null }),
  setProgress: (stage, detail) => set({ stage, detail, loading: stage !== 'complete', error: null }),
  setError: (error) => set({ error, loading: false })
}));

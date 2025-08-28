import { create } from 'zustand';

interface Treatment {
  id: string;
  organizationId: string;
  memberId: string;
  providerType: string;
  status: string;
  totalAmount?: string;
  insurerShare?: string;
  memberShare?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Add items if needed
}

interface TreatmentStore {
  treatments: Treatment[];
  loading: boolean;
  error: string | null;
  fetchTreatments: () => Promise<void>;
}

export const useTreatmentStore = create<TreatmentStore>((set) => ({
  treatments: [],
  loading: false,
  error: null,
  fetchTreatments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/hospital/treatments');
      if (!res.ok) throw new Error('Failed to fetch treatments');
      const data = await res.json();
      set({ treatments: data, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Unknown error', loading: false });
    }
  },
}));

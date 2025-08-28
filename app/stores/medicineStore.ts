import { create } from 'zustand';

interface Medicine {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  price: string;
  createdAt: string;
  updatedAt: string;
}

interface MedicineStore {
  medicines: Medicine[];
  loading: boolean;
  error: string | null;
  fetchMedicines: () => Promise<void>;
}

export const useMedicineStore = create<MedicineStore>((set) => ({
  medicines: [],
  loading: false,
  error: null,
  fetchMedicines: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/pharmacy/medicines');
      if (!res.ok) throw new Error('Failed to fetch medicines');
      const data = await res.json();
      set({ medicines: data, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Unknown error', loading: false });
    }
  },
}));

import { create } from 'zustand';

interface PharmacyRequest {
  id: string;
  organizationId: string;
  memberId: string;
  status: string;
  totalAmount?: string;
  insurerShare?: string;
  memberShare?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Add items if needed
}

interface RequestStore {
  requests: PharmacyRequest[];
  loading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
}

export const useRequestStore = create<RequestStore>((set) => ({
  requests: [],
  loading: false,
  error: null,
  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/pharmacy/requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      set({ requests: data, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Unknown error', loading: false });
    }
  },
}));

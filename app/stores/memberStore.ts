import { create } from 'zustand';

interface Member {
  id: string;
  memberCode: string;
  name: string;
  dob: string;
  contact?: string;
  email?: string;
  address?: string;
  idNumber?: string;
  passportPhotoUrl?: string;
  dependentProofUrl?: string;
  isDependent: boolean;
  familyRelationship?: string;
  gender?: string;
  country?: string;
  companyId?: string;
  paidBy?: string;
  category: string;
  coveragePercent: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface MemberStore {
  members: Member[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
}

export const useMemberStore = create<MemberStore>((set) => ({
  members: [],
  loading: false,
  error: null,
  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      set({ members: data, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Unknown error', loading: false });
    }
  },
}));

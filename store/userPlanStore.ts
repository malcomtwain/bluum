import { create } from 'zustand';

export type PlanType = 'free' | 'basic' | 'professional' | 'business';

interface UserPlanState {
  plan: PlanType;
  videoCredits: number;
  maxCredits: number;
  setPlan: (email: string | null | undefined) => void;
}

export const useUserPlanStore = create<UserPlanState>((set) => ({
  plan: 'free',
  videoCredits: 0,
  maxCredits: 0,
  setPlan: (email) => {
    if (!email) {
      set({ plan: 'free', videoCredits: 0, maxCredits: 0 });
      return;
    }

    // Attribution du plan en fonction de l'email
    if (email === 'bluumfrerk@gmail.com') {
      set({ plan: 'business', videoCredits: 2000, maxCredits: 2000 });
    } else {
      // Par défaut, les utilisateurs ont un plan gratuit avec 0 crédits
      // Vous pouvez ajouter d'autres règles d'attribution ici
      set({ plan: 'free', videoCredits: 0, maxCredits: 0 });
    }
  },
})); 
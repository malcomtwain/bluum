import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '../hooks/useSupabase';

export const SupabaseSync = () => {
  const { user } = useUser();
  const { syncUser } = useSupabase();

  useEffect(() => {
    if (user) {
      syncUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, syncUser]);

  return null;
}; 
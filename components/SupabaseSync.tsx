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
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      });
    }
  }, [user, syncUser]);

  return null;
}; 
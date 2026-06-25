import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  company_name: string | null;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, companyName: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribeFn: (() => void) | undefined;

    const initAuth = async () => {
      const { supabase } = await import('@/lib/supabase');
      if (!active) return;

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!active) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      unsubscribeFn = () => subscription.unsubscribe();
    };

    initAuth();

    return () => {
      active = false;
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      // Get user metadata from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          id: user.id,
          email: user.email || '',
          company_name: user.user_metadata?.company_name || null,
          full_name: user.user_metadata?.full_name || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, companyName: string, fullName?: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      // Just sign up the user - no company needed!
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
            full_name: fullName || null,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Fetch the profile
      await fetchProfile(authData.user.id);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

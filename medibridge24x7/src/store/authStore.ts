import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User, Organization, OrganizationSettings, Session } from '../lib/types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  orgSettings: OrganizationSettings | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setOrganization: (organization: Organization | null) => void;
  setOrgSettings: (settings: OrganizationSettings | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUserData: (authUserId: string) => Promise<void>;
  initialize: () => Promise<void>;
  applyTheme: (primaryColor?: string, secondaryColor?: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  orgSettings: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOrganization: (organization) => set({ organization }),
  setOrgSettings: (orgSettings) => {
    set({ orgSettings });
    if (orgSettings) {
      get().applyTheme(orgSettings.primary_color, orgSettings.secondary_color);
    }
  },
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  applyTheme: (primaryColor?: string, secondaryColor?: string) => {
    const root = document.documentElement;

    if (primaryColor) {
      root.style.setProperty('--primary-color', primaryColor);
    } else {
      root.style.setProperty('--primary-color', '#3B82F6');
    }

    if (secondaryColor) {
      root.style.setProperty('--secondary-color', secondaryColor);
    } else {
      root.style.setProperty('--secondary-color', '#1E40AF');
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await get().loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        organization: null,
        orgSettings: null,
        session: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadUserData: async (authUserId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (userError) throw userError;

      if (userData) {
        set({ user: userData, isAuthenticated: true });

        const { data: orgStaffData, error: orgStaffError } = await supabase
          .from('org_staff')
          .select('organization_id')
          .eq('user_id', userData.id)
          .maybeSingle();

        if (orgStaffError && orgStaffError.code !== 'PGRST116') {
          throw orgStaffError;
        }

        if (orgStaffData) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgStaffData.organization_id)
            .maybeSingle();

          if (orgError) throw orgError;
          if (orgData) set({ organization: orgData });

          const { data: settingsData, error: settingsError } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('organization_id', orgStaffData.organization_id)
            .maybeSingle();

          if (settingsError && settingsError.code !== 'PGRST116') {
            throw settingsError;
          }
          if (settingsData) set({ orgSettings: settingsData });
        }
      }
    } catch (error) {
      console.error('Load user data error:', error);
      throw error;
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ session: session as Session });
        await get().loadUserData(session.user.id);
      }

      supabase.auth.onAuthStateChange((event, session) => {
        (async () => {
          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully');
            set({ session: session as Session });
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              organization: null,
              orgSettings: null,
              session: null,
              isAuthenticated: false,
            });
          } else if (event === 'SIGNED_IN' && session?.user) {
            set({ session: session as Session });
            await get().loadUserData(session.user.id);
          } else if (session?.user) {
            set({ session: session as Session });
            await get().loadUserData(session.user.id);
          } else {
            set({
              user: null,
              organization: null,
              orgSettings: null,
              session: null,
              isAuthenticated: false,
            });
          }
        })();
      });
    } catch (error) {
      console.error('Initialize error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

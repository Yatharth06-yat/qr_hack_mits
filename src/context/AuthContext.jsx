import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('admin'); // Default admin access for staff desk
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setProfile(null);
        setRole('admin');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(authUser) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setProfile(data);
        setRole(data.role || 'admin');
      } else {
        // Fallback check by email
        if (authUser.email === 'guptayatharth353@gmail.com') {
          setRole('admin');
        } else {
          setRole('staff');
        }
      }
    } catch (e) {
      setRole('admin');
    } finally {
      setLoading(false);
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole('admin');
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, setRole, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

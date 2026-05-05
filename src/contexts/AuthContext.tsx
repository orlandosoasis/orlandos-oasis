import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "homeowner" | "technician" | "admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
    extra?: { streetAddress?: string; city?: string; state?: string; zipCode?: string; phone?: string; firstName?: string; lastName?: string; contractLocked?: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    email: p.email,
    fullName: p.full_name ?? "",
    firstName: p.first_name ?? undefined,
    lastName: p.last_name ?? undefined,
    role: p.role,
    avatarUrl: p.avatar_url ?? undefined,
    phone: p.phone ?? undefined,
    streetAddress: p.street_address ?? undefined,
    city: p.city ?? undefined,
    state: p.state ?? undefined,
    zipCode: p.zip_code ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return profileToUser(data as ProfileRow);
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Defer Supabase call to avoid deadlock
        setTimeout(async () => {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        }, 0);
      } else {
        setUser(null);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) return { success: false, error: error.message };
    // Fetch profile immediately so caller can route by role without race.
    let role: UserRole | undefined;
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setUser(profile);
        role = profile.role;
      } else {
        await supabase.auth.signOut();
        return { success: false, error: "We couldn't load your account profile. Please try signing in again." };
      }
    }
    return { success: true, role };
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = "homeowner",
    extra?: { streetAddress?: string; city?: string; state?: string; zipCode?: string; phone?: string; firstName?: string; lastName?: string; contractLocked?: boolean }
  ) => {
    const normalizedEmail = email.toLowerCase().trim();
    const firstName = extra?.firstName || fullName.split(" ")[0];
    const lastName = extra?.lastName || fullName.split(" ").slice(1).join(" ");

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          role,
        },
      },
    });
    if (error) return { success: false, error: error.message };

    // Update extra profile fields if provided
    if (
      data.user &&
      (extra?.phone ||
        extra?.streetAddress ||
        extra?.city ||
        extra?.state ||
        extra?.zipCode ||
        extra?.contractLocked !== undefined)
    ) {
      const patch: {
        phone: string | null;
        street_address: string | null;
        city: string | null;
        state: string | null;
        zip_code: string | null;
        contract_locked?: boolean;
        contract_start_date?: string;
      } = {
        phone: extra.phone ?? null,
        street_address: extra.streetAddress ?? null,
        city: extra.city ?? null,
        state: extra.state ?? null,
        zip_code: extra.zipCode ?? null,
      };
      if (extra.contractLocked !== undefined) {
        patch.contract_locked = extra.contractLocked;
        patch.contract_start_date = new Date().toISOString().slice(0, 10);
      }
      await supabase.from("profiles").update(patch).eq("id", data.user.id);
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const optimistic = { ...user, ...updates };
    setUser(optimistic);

    const dbUpdates: Partial<Omit<ProfileRow, "id">> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.streetAddress !== undefined) dbUpdates.street_address = updates.streetAddress;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("profiles").update(dbUpdates).eq("id", user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

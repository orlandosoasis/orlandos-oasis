import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, role?: UserRole, address?: { streetAddress?: string; city?: string; state?: string; zipCode?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "orlandos_oasis_auth";

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "demo@example.com": {
    password: "demo123",
    user: {
      id: "user-1",
      email: "demo@example.com",
      fullName: "John Smith",
      firstName: "John",
      lastName: "Smith",
      role: "homeowner",
      phone: "(407) 555-1234",
      streetAddress: "1234 Sunshine Blvd",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
    },
  },
  "tech@example.com": {
    password: "tech123",
    user: {
      id: "tech-1",
      email: "tech@example.com",
      fullName: "Mike Johnson",
      role: "technician",
      phone: "(407) 555-5678",
    },
  },
  "admin@example.com": {
    password: "admin123",
    user: {
      id: "admin-1",
      email: "admin@example.com",
      fullName: "Sarah Admin",
      role: "admin",
      phone: "(407) 555-9999",
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const normalizedEmail = email.toLowerCase().trim();
    const mockUser = MOCK_USERS[normalizedEmail];

    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser.user }));
      return { success: true };
    }

    // Check if user was registered during this session
    const registered = localStorage.getItem(`registered_${normalizedEmail}`);
    if (registered) {
      const userData = JSON.parse(registered);
      if (userData.password === password) {
        setUser(userData.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData.user }));
        return { success: true };
      }
    }

    return { success: false, error: "Invalid email or password" };
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = "homeowner"
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    if (MOCK_USERS[normalizedEmail] || localStorage.getItem(`registered_${normalizedEmail}`)) {
      return { success: false, error: "An account with this email already exists" };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      fullName,
      role,
    };

    // Store the new user
    localStorage.setItem(`registered_${normalizedEmail}`, JSON.stringify({ password, user: newUser }));
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser }));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
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

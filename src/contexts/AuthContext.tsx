// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email?: string, mobile?: string) => Promise<void>;
  register: (name: string, email?: string, mobile?: string) => Promise<void>;
  verifyOTP: (userId: number, otp: string) => Promise<void>;
  logout: () => void;
  pendingUserId: number | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  useEffect(() => {
    console.log("🔄 AuthProvider mounted");
    // Check if user is already logged in
    const token = api.getToken();
    const storedUser = localStorage.getItem('user');
    
    console.log("🔍 Checking stored auth:", { tokenExists: !!token, storedUserExists: !!storedUser });
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("✅ Found stored user:", parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("❌ Failed to parse stored user:", error);
        api.removeToken();
        localStorage.removeItem('user');
      }
    } else {
      console.log("ℹ️ No stored auth found");
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email?: string, mobile?: string) => {
    console.log("🔐 Login function called:", { email, mobile });
    try {
      const data = email ? { email } : { mobile };
      console.log("📤 Sending login request with:", data);
      const response = await api.login(data);
      console.log("✅ Login OTP sent, user_id:", response.user_id);
      setPendingUserId(response.user_id);
    } catch (error: any) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  const register = async (name: string, email?: string, mobile?: string) => {
    console.log("👤 Register function called:", { name, email, mobile });
    try {
      const data = email ? { name, email } : { name, mobile };
      console.log("📤 Sending register request with:", data);
      const response = await api.register(data);
      console.log("✅ Register OTP sent, user_id:", response.user_id);
      setPendingUserId(response.user_id);
    } catch (error: any) {
      console.error("❌ Register error:", error);
      throw error;
    }
  };

  const verifyOTP = async (userId: number, otp: string) => {
    console.log("✅ Verify OTP function called:", { userId, otp });
    try {
      console.log("📤 Sending OTP verification request...");
      const response = await api.verifyOTP({ user_id: userId, otp });
      console.log("✅ OTP verified successfully, token received");
      console.log("👤 User data:", response.user);
      
      // Store token and user data
      api.setToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      setPendingUserId(null);
      
      console.log("🔐 Authentication complete, user set in state");
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("🚪 Logout function called");
    api.removeToken();
    localStorage.removeItem('user');
    setUser(null);
    setPendingUserId(null);
    console.log("✅ User logged out");
  };

  const isAuthenticated = !!user;
  
  console.log("📊 Auth State:", { user, isLoading, pendingUserId, isAuthenticated });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyOTP,
        logout,
        pendingUserId,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
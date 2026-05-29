import { createContext, useContext, useEffect, useState } from "react";
import type { Account } from "@workspace/api-client-react";

interface AuthContextType {
  user: Account | null;
  signIn: (account: Account) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(() => {
    try {
      const stored = localStorage.getItem("indigene_auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const signIn = (account: Account) => {
    localStorage.setItem("indigene_auth_user", JSON.stringify(account));
    setUser(account);
  };

  const signOut = () => {
    localStorage.removeItem("indigene_auth_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
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

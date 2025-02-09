import { createContext, useContext, useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "wouter";

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  googleDriveToken: string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("google_token");
    const userData = localStorage.getItem("user_data");
    if (token && userData) {
      setUser(JSON.parse(userData));
      setGoogleDriveToken(token);
    }
  }, []);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser(decoded);
      setGoogleDriveToken(credentialResponse.credential);
      
      // Store session
      localStorage.setItem("google_token", credentialResponse.credential);
      localStorage.setItem("user_data", JSON.stringify(decoded));
      
      setLocation("/");
    }
  };

  const signOut = () => {
    setUser(null);
    setGoogleDriveToken(null);
    localStorage.removeItem("google_token");
    localStorage.removeItem("user_data");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        googleDriveToken,
        signOut 
      }}
    >
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 
import React, { useState, useEffect } from "react";
import { signInWithGoogle, signOut, auth } from "../auth/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { LogIn, LogOut } from "lucide-react";

const Login = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black">
      {user ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-white text-sm mb-2">
            Signed in as {user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-white border border-white px-6 py-2 rounded-md hover:bg-white hover:text-black transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="flex items-center gap-2 text-white border border-white px-6 py-2 rounded-md hover:bg-white hover:text-black transition-all"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default Login;

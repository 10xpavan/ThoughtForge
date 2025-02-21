import React from "react";
import { signInWithGoogle, logout } from "../firebase";

const Login = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <button
        onClick={signInWithGoogle}
        className="text-white border border-white px-6 py-2 rounded-md hover:bg-white hover:text-black transition-all"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;

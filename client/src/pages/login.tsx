import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome to Journal</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google to start journaling
          </p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.log('Login Failed');
            }}
          />
        </div>
      </div>
    </div>
  );
} 
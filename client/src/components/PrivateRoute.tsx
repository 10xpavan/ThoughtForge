import { Route, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function PrivateRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Route {...rest} component={Component} />;
} 
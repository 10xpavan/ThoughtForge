import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EntryPage from "@/pages/entry";
import { AuthProvider } from "./lib/auth";
import { LoginPage } from "./pages/login";
import { PrivateRoute } from "./components/PrivateRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <PrivateRoute path="/" component={Home} />
      <PrivateRoute path="/new" component={EntryPage} />
      <PrivateRoute path="/entry/:id" component={EntryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
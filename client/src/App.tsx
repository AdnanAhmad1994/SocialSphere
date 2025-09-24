import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import CustomLoginForm from "@/components/CustomLoginForm";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, refreshAuth } = useCustomAuth();

  const handleLoginSuccess = () => {
    refreshAuth();
  };

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={() => <CustomLoginForm onLoginSuccess={handleLoginSuccess} />} />
      ) : (
        <>
          <Route path="/" component={Home} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;